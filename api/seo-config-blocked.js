// vercel.json rewrites /seo-config.json here so the password hash is not served
// as a static file. It still lives in the repo, which is public — see README.
export default function handler(req, res) {
  return res.status(404).json({ error: 'Not found' });
}
