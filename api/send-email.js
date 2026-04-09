export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { subject, bookingDetails, customerEmail, customerName, slipBase64, slipFileName } = req.body;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = 'adaywithelephants@gmail.com';

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    }

    const attachments = [];
    if (slipBase64) {
      const base64Data = slipBase64.replace(/^data:image\/\w+;base64,/, '');
      attachments.push({
        filename: slipFileName || 'payment-slip.jpg',
        content: base64Data,
      });
    }

    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;">
        <h2 style="color:#4CAF50;">New Booking Payment</h2>
        <pre style="background:#f5f5f5;padding:15px;border-radius:8px;font-size:14px;line-height:1.6;">${bookingDetails}</pre>
        ${slipBase64 ? '<p style="color:#888;font-size:13px;">Payment slip attached to this email.</p>' : ''}
      </div>
    `;

    const adminPayload = {
      from: 'A Day in Chiangmai <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: subject,
      html: adminHtml,
    };

    if (attachments.length > 0) {
      adminPayload.attachments = attachments;
    }

    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminPayload),
    });

    const adminResult = await adminRes.json();
    console.log('Admin email result:', JSON.stringify(adminResult));

    if (!adminRes.ok) {
      console.error('Admin email failed:', JSON.stringify(adminResult));
      return res.status(500).json({ error: 'Failed to send admin email', details: adminResult });
    }

    if (customerEmail) {
      const customerHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#8B7355;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:22px;">A Day in Chiangmai</h1>
            <p style="color:#ddd;margin:5px 0 0;">Elephant Sanctuary Experience</p>
          </div>
          <div style="background:white;padding:25px;border:1px solid #eee;">
            <h2 style="color:#4CAF50;text-align:center;">Booking Confirmed!</h2>
            <p style="color:#555;line-height:1.6;">Dear ${customerName || 'Guest'},</p>
            <p style="color:#555;line-height:1.6;">Thank you for your booking! We have received your information and payment details. Our team will contact you within <strong>3 hours</strong> to confirm your reservation.</p>
            <div style="background:#f9f6f2;padding:15px;border-radius:8px;margin:15px 0;">
              <pre style="font-size:13px;line-height:1.6;color:#555;margin:0;white-space:pre-wrap;">${bookingDetails}</pre>
            </div>
            <div style="background:#FFF8E7;border-left:3px solid #FFB74D;padding:12px;border-radius:0 8px 8px 0;margin:15px 0;">
              <p style="margin:0;color:#8B7355;font-size:14px;">For urgent inquiries, contact us directly:</p>
              <p style="margin:5px 0 0;"><a href="https://wa.me/66909962308" style="color:#25D366;font-weight:bold;text-decoration:none;">WhatsApp: +66 90 996 2308</a></p>
            </div>
          </div>
          <div style="background:#f5f1ec;padding:15px;border-radius:0 0 12px 12px;text-align:center;">
            <p style="color:#999;font-size:12px;margin:0;">A Day in Chiangmai | Elephant Sanctuary</p>
          </div>
        </div>
      `;

      const custRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'A Day in Chiangmai <onboarding@resend.dev>',
          to: [customerEmail],
          subject: 'Booking Confirmed - A Day in Chiangmai',
          html: customerHtml,
        }),
      });

      const custResult = await custRes.json();
      console.log('Customer email result:', JSON.stringify(custResult));
    }

    return res.status(200).json({ success: true, adminEmail: adminResult });

  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: error.message });
  }
}
