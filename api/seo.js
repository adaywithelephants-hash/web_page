import crypto from 'crypto';

/**
 * SEO settings API.
 *
 * seo.json is the source of truth. Saving rewrites the <head> of index.html and
 * receipt.html plus every alt="" tagged with data-seo-alt, then pushes all of it
 * as ONE commit through the GitHub Git Data API. Vercel redeploys from that push,
 * so the tags end up in the served HTML — which is what social crawlers read.
 *
 * Required env: GITHUB_TOKEN (fine-grained PAT, Contents: read+write on this repo)
 * Optional env: GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, SEO_ADMIN_PASSWORD
 */

const OWNER = process.env.GITHUB_OWNER || 'adaywithelephants-hash';
const REPO = process.env.GITHUB_REPO || 'web_page';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

const SEO_PATH = 'seo.json';
const AUTH_PATH = 'seo-config.json';
const PAGES = ['index.html', 'receipt.html'];

const PBKDF2_ITERATIONS = 210000;
const DEFAULT_PASSWORD = '1234';

// ---------------------------------------------------------------- schema

// Every editable field, so unknown keys from the client are dropped rather than
// written into the repo. maxLength keeps a runaway paste from bloating the HTML.
const SCHEMA = {
  site: {
    lang: 16, title: 200, description: 400, keywords: 500,
    robots: 100, canonical: 500, favicon: 500,
  },
  openGraph: {
    title: 200, description: 400, url: 500, type: 50, image: 500, siteName: 200,
  },
  twitter: { card: 50, title: 200, description: 400, image: 500 },
  jsonLd: {
    type: 50, name: 200, description: 600, url: 500, image: 500,
    addressLocality: 100, addressCountry: 10, telephone: 50, priceRange: 100,
  },
  receipt: { title: 200, favicon: 500 },
};

const IMAGE_KEYS = [
  'nav-logo', 'feature',
  'gallery-1', 'gallery-2', 'gallery-3', 'gallery-4', 'gallery-5', 'gallery-6', 'gallery-7',
  'info', 'review-1', 'review-2', 'review-3',
  'qr-whatsapp', 'qr-line', 'footer-logo',
];

function sanitize(input) {
  if (!input || typeof input !== 'object') throw new Error('Invalid SEO payload');

  const out = {};
  for (const [group, fields] of Object.entries(SCHEMA)) {
    const src = input[group] || {};
    if (typeof src !== 'object') throw new Error(`Invalid group: ${group}`);
    out[group] = {};
    for (const [field, maxLength] of Object.entries(fields)) {
      const raw = src[field];
      const value = (raw == null ? '' : String(raw)).replace(/\s+/g, ' ').trim();
      if (value.length > maxLength) {
        throw new Error(`${group}.${field} is too long (max ${maxLength} characters)`);
      }
      out[group][field] = value;
    }
  }

  out.images = {};
  const srcImages = input.images || {};
  for (const key of IMAGE_KEYS) {
    const value = (srcImages[key] == null ? '' : String(srcImages[key])).replace(/\s+/g, ' ').trim();
    if (value.length > 250) throw new Error(`images.${key} is too long (max 250 characters)`);
    out.images[key] = value;
  }

  if (!out.site.title) throw new Error('Page title is required');
  if (!out.site.description) throw new Error('Meta description is required');

  return out;
}

// ---------------------------------------------------------------- rendering

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const BANNER = '  <!-- Generated from seo.json by /api/seo. Edit at /seo-admin.html — hand edits here are overwritten on the next save. -->';

function renderIndexHead(seo) {
  const { site, openGraph: og, twitter: tw, jsonLd: ld } = seo;

  const structured = {
    '@context': 'https://schema.org',
    '@type': ld.type || 'TouristAttraction',
    name: ld.name,
    description: ld.description,
    url: ld.url,
    image: ld.image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: ld.addressLocality,
      addressCountry: ld.addressCountry,
    },
    telephone: ld.telephone,
    priceRange: ld.priceRange,
  };
  // JSON.stringify leaves "<" alone, which would let a value close the <script> tag early.
  const structuredJson = JSON.stringify(structured, null, 2).replace(/</g, '\\u003c');

  const lines = [
    BANNER,
    `  <title>${esc(site.title)}</title>`,
    `  <meta name="description" content="${esc(site.description)}">`,
  ];
  if (site.keywords) lines.push(`  <meta name="keywords" content="${esc(site.keywords)}">`);
  if (site.robots) lines.push(`  <meta name="robots" content="${esc(site.robots)}">`);
  if (site.canonical) lines.push(`  <link rel="canonical" href="${esc(site.canonical)}">`);

  if (og.title) lines.push(`  <meta property="og:title" content="${esc(og.title)}">`);
  if (og.description) lines.push(`  <meta property="og:description" content="${esc(og.description)}">`);
  if (og.url) lines.push(`  <meta property="og:url" content="${esc(og.url)}">`);
  if (og.type) lines.push(`  <meta property="og:type" content="${esc(og.type)}">`);
  if (og.image) lines.push(`  <meta property="og:image" content="${esc(og.image)}">`);
  if (og.siteName) lines.push(`  <meta property="og:site_name" content="${esc(og.siteName)}">`);

  if (tw.card) lines.push(`  <meta name="twitter:card" content="${esc(tw.card)}">`);
  if (tw.title) lines.push(`  <meta name="twitter:title" content="${esc(tw.title)}">`);
  if (tw.description) lines.push(`  <meta name="twitter:description" content="${esc(tw.description)}">`);
  if (tw.image) lines.push(`  <meta name="twitter:image" content="${esc(tw.image)}">`);

  lines.push('  <script type="application/ld+json">');
  lines.push(structuredJson);
  lines.push('  </script>');

  if (site.favicon) lines.push(`  <link rel="icon" type="image/png" href="${esc(site.favicon)}">`);

  return lines.join('\n');
}

function renderReceiptHead(seo) {
  const lines = [BANNER, `  <title>${esc(seo.receipt.title)}</title>`];
  if (seo.receipt.favicon) {
    lines.push(`  <link rel="icon" type="image/png" href="${esc(seo.receipt.favicon)}">`);
  }
  return lines.join('\n');
}

const MARKER_RE = /<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/;

function applyToPage(html, path, seo) {
  if (!MARKER_RE.test(html)) {
    throw new Error(`${path} is missing the <!-- SEO:START --> / <!-- SEO:END --> markers`);
  }

  const block = path === 'receipt.html' ? renderReceiptHead(seo) : renderIndexHead(seo);
  let out = html.replace(MARKER_RE, `<!-- SEO:START -->\n${block}\n  <!-- SEO:END -->`);

  // Rewrite alt="" only inside the <img> carrying the matching data-seo-alt key.
  for (const [key, alt] of Object.entries(seo.images)) {
    const tagRe = new RegExp(`<img\\b[^>]*\\bdata-seo-alt="${key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}"[^>]*>`, 'g');
    out = out.replace(tagRe, (tag) => tag.replace(/\salt="[^"]*"/, ` alt="${esc(alt)}"`));
  }

  // Keep <html lang> in step with the declared language.
  if (seo.site.lang) out = out.replace(/<html lang="[^"]*">/, `<html lang="${esc(seo.site.lang)}">`);

  return out;
}

// Exported for the local round-trip test; Vercel only ever calls the default export.
export { sanitize, applyToPage, renderIndexHead, renderReceiptHead };
export const __test__ = {};

// ---------------------------------------------------------------- github

/**
 * Pasting a token into the Vercel dashboard often drags a trailing newline along,
 * and quoting the value is an easy habit to carry over from .env files. Either one
 * corrupts the header and comes back as "Bad credentials", so clean both off.
 */
function readToken() {
  return (process.env.GITHUB_TOKEN || '').trim().replace(/^["']|["']$/g, '').trim();
}

async function gh(path, options = {}) {
  const token = readToken();
  if (!token) throw new Error('GITHUB_TOKEN is not configured in Vercel');

  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'adaywithelephants-seo-admin',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (res.status === 404 && options.allow404) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data && data.message ? data.message : `HTTP ${res.status}`;
    if (res.status === 401) {
      throw new Error(
        'GitHub rejected the token (Bad credentials). Open /api/seo?check=1 to see exactly what is wrong.',
      );
    }
    if (res.status === 403) {
      throw new Error(
        `GitHub refused the request (${detail}). The token is valid but lacks "Contents: Read and write" on this ` +
        'repository, or a fine-grained token is still waiting for owner approval. See /api/seo?check=1',
      );
    }
    throw new Error(`GitHub: ${detail}`);
  }
  return data;
}

/**
 * Unauthenticated on purpose: a broken token makes login impossible, so this has
 * to work without one. It reveals no token characters — only its shape.
 */
async function diagnose() {
  const raw = process.env.GITHUB_TOKEN;
  const token = readToken();

  const report = {
    repo: `${OWNER}/${REPO}`,
    branch: BRANCH,
    token: {
      configured: !!raw,
      length: token.length,
      hadSurroundingWhitespace: !!raw && raw !== raw.trim(),
      hadSurroundingQuotes: /^["']|["']$/.test((raw || '').trim()),
      kind: token.startsWith('github_pat_') ? 'fine-grained (github_pat_)'
        : token.startsWith('ghp_') ? 'classic (ghp_)'
        : token.startsWith('ghs_') ? 'app installation (ghs_)'
        : token ? 'unrecognised prefix'
        : 'none',
    },
    checks: {},
    verdict: '',
  };

  if (!token) {
    report.verdict = 'GITHUB_TOKEN is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.';
    return report;
  }

  const call = async (path) => {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'adaywithelephants-seo-admin',
      },
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  };

  const who = await call('/user');
  report.checks.authenticate = who.status === 200
    ? { ok: true, login: who.body.login }
    : { ok: false, status: who.status, message: who.body && who.body.message };

  if (who.status === 401) {
    const expected = token.startsWith('github_pat_') ? 93 : token.startsWith('ghp_') ? 40 : 0;
    report.verdict =
      expected && token.length !== expected
        ? `This looks truncated — a ${report.token.kind} token is normally ${expected} characters but this one is ${token.length}. Copy the whole value and update GITHUB_TOKEN in Vercel, then redeploy.`
        : 'GitHub does not recognise this token — most likely expired or revoked. Generate a new one, update GITHUB_TOKEN in Vercel, then redeploy.';
    return report;
  }

  const repo = await call(`/repos/${OWNER}/${REPO}`);
  report.checks.repository = repo.status === 200
    ? { ok: true, private: repo.body.private, canPush: !!(repo.body.permissions && repo.body.permissions.push) }
    : { ok: false, status: repo.status, message: repo.body && repo.body.message };

  if (repo.status !== 200) {
    report.verdict = `The token authenticates but cannot see ${OWNER}/${REPO}. Make sure its repository access includes this repo (and, for a fine-grained token on an organisation, that an owner approved it).`;
    return report;
  }
  if (!report.checks.repository.canPush) {
    report.verdict = 'The token can read the repository but not write to it. Set Permissions → Contents: Read and write.';
    return report;
  }

  const ref = await call(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  report.checks.branch = ref.status === 200
    ? { ok: true, head: ref.body.object.sha.slice(0, 7) }
    : { ok: false, status: ref.status, message: ref.body && ref.body.message };

  report.verdict = ref.status === 200
    ? 'All good — the token can read and write this repository.'
    : `Branch "${BRANCH}" was not found. Set GITHUB_BRANCH in Vercel if the default branch has another name.`;
  return report;
}

async function readFile(path) {
  const data = await gh(
    `/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { allow404: true },
  );
  if (!data) return null;
  return Buffer.from(data.content, 'base64').toString('utf8');
}

/** Commits every changed file in a single commit so Vercel deploys once. */
async function commitFiles(files, message) {
  const ref = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const headSha = ref.object.sha;
  const headCommit = await gh(`/repos/${OWNER}/${REPO}/git/commits/${headSha}`);

  const tree = [];
  for (const [path, content] of Object.entries(files)) {
    const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: Buffer.from(content, 'utf8').toString('base64'),
        encoding: 'base64',
      }),
    });
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree }),
  });

  if (newTree.sha === headCommit.tree.sha) return null; // nothing actually changed

  const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }),
  });

  await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return commit.sha;
}

// ---------------------------------------------------------------- auth

function hashPassword(password, salt, iterations = PBKDF2_ITERATIONS) {
  return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
}

function buildAuthConfig(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    _comment: 'Password hash for /seo-admin.html. Never stores the password itself.',
    algorithm: 'pbkdf2-sha256',
    iterations: PBKDF2_ITERATIONS,
    salt,
    hash: hashPassword(password, salt),
  };
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function verifyPassword(password) {
  if (typeof password !== 'string' || !password) return false;

  const raw = await readFile(AUTH_PATH);
  if (!raw) {
    // No config committed yet — fall back to the bootstrap password.
    return safeEqual(password, process.env.SEO_ADMIN_PASSWORD || DEFAULT_PASSWORD);
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!config.salt || !config.hash) return false;

  return safeEqual(
    hashPassword(password, config.salt, config.iterations || PBKDF2_ITERATIONS),
    config.hash,
  );
}

Object.assign(__test__, { hashPassword, buildAuthConfig, safeEqual, diagnose });

// Best-effort throttle. Serverless instances are not shared, so this slows a
// single-instance guesser rather than providing a hard global limit.
const attempts = new Map();

function throttled(ip) {
  const record = attempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.first > 15 * 60 * 1000) {
    attempts.delete(ip);
    return false;
  }
  return record.count >= 10;
}

function recordFailure(ip) {
  const record = attempts.get(ip);
  if (!record || Date.now() - record.first > 15 * 60 * 1000) {
    attempts.set(ip, { count: 1, first: Date.now() });
  } else {
    record.count += 1;
  }
}

// ---------------------------------------------------------------- handler

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (req.query && req.query.check) {
        return res.status(200).json(await diagnose());
      }
      const raw = await readFile(SEO_PATH);
      if (!raw) return res.status(404).json({ error: 'seo.json not found in the repository' });
      const hasAuthConfig = (await readFile(AUTH_PATH)) !== null;
      return res.status(200).json({ seo: JSON.parse(raw), usingDefaultPassword: !hasAuthConfig });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, password, newPassword, seo } = req.body || {};
    const ip = req.headers['x-forwarded-for'] || 'unknown';

    if (throttled(ip)) {
      return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    }

    if (!(await verifyPassword(password))) {
      recordFailure(ip);
      await new Promise((r) => setTimeout(r, 600));
      return res.status(401).json({ error: 'Wrong password' });
    }
    attempts.delete(ip);

    if (action === 'login') {
      const hasAuthConfig = (await readFile(AUTH_PATH)) !== null;
      return res.status(200).json({ success: true, usingDefaultPassword: !hasAuthConfig });
    }

    if (action === 'change-password') {
      if (typeof newPassword !== 'string' || newPassword.length < 4) {
        return res.status(400).json({ error: 'New password must be at least 4 characters' });
      }
      const config = buildAuthConfig(newPassword);
      const commit = await commitFiles(
        { [AUTH_PATH]: JSON.stringify(config, null, 2) + '\n' },
        'chore(seo): change admin password',
      );
      return res.status(200).json({ success: true, commit });
    }

    if (action === 'save') {
      const clean = sanitize(seo);

      const files = { [SEO_PATH]: JSON.stringify(clean, null, 2) + '\n' };
      for (const path of PAGES) {
        const html = await readFile(path);
        if (html == null) throw new Error(`${path} not found in the repository`);
        files[path] = applyToPage(html, path, clean);
      }

      const commit = await commitFiles(files, 'chore(seo): update SEO settings via admin page');
      return res.status(200).json({
        success: true,
        changed: commit !== null,
        commit,
        seo: clean,
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('SEO API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
