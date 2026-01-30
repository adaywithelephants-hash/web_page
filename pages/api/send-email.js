import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, tourPackage, travelers, message } = req.body;

  if (!name || !email || !phone || !tourPackage) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: 'Tour Booking <onboarding@resend.dev>',
      to: 'wongchapat.james@gmail.com',
      subject: `🎫 การจองทัวร์ใหม่: ${tourPackage}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 30px; border-radius: 10px;">
            <h1 style="color: #c9a959; margin: 0 0 20px 0; font-size: 24px;">✨ การจองทัวร์ใหม่</h1>
            
            <div style="background: #0d0d0d; padding: 20px; border-radius: 8px; border-left: 3px solid #c9a959;">
              <table style="width: 100%; color: #f5f0e6; font-size: 14px;">
                <tr>
                  <td style="padding: 10px 0; color: #c9a959; width: 140px;">ชื่อ-นามสกุล:</td>
                  <td style="padding: 10px 0;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #c9a959;">อีเมล:</td>
                  <td style="padding: 10px 0;"><a href="mailto:${email}" style="color: #e8d5a3;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #c9a959;">เบอร์โทร:</td>
                  <td style="padding: 10px 0;"><a href="tel:${phone}" style="color: #e8d5a3;">${phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #c9a959;">แพ็กเกจทัวร์:</td>
                  <td style="padding: 10px 0; font-weight: bold;">${tourPackage}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #c9a959;">จำนวนผู้เดินทาง:</td>
                  <td style="padding: 10px 0;">${travelers} ท่าน</td>
                </tr>
                ${message ? `
                <tr>
                  <td style="padding: 10px 0; color: #c9a959; vertical-align: top;">ข้อความ:</td>
                  <td style="padding: 10px 0;">${message}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <p style="color: #888; font-size: 12px; margin-top: 20px;">
              ส่งจากระบบจองทัวร์ Wanderlust Tours<br>
              ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}
            </p>
          </div>
        </div>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
