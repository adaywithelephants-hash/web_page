const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent.latest_charge', 'line_items']
    });

    const metadata = session.metadata;
    const amount = session.amount_total / 100;
    const paymentType = metadata.payment_type === 'deposit' ? '💰 DEPOSIT (มัดจำ)' : '💎 FULL PAYMENT (จ่ายเต็ม)';
    
    const emailBody = `
🐘 NEW BOOKING PAYMENT RECEIVED!
================================

${paymentType}
💵 Amount: ฿${amount.toLocaleString()}

👤 Customer Information:
- Name: ${metadata.customer_name}
- Email: ${session.customer_email}
- Phone: ${metadata.customer_phone || 'Not specified'}
- Country: ${metadata.country || 'Not specified'}

📋 Tour Details:
- Package: ${metadata.tour_package}
- Date: ${metadata.tour_date}
- Adults: ${metadata.adults}
- Children: ${metadata.children}

🏨 Hotel: ${metadata.hotel || 'Not specified'}

📝 Special Requests:
${metadata.special_requests || 'None'}

================================
View in Stripe Dashboard for more details
    `.trim();

    await fetch('https://formspree.io/f/mzdgawqp', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        subject: `${paymentType} - ${metadata.customer_name} - ฿${amount.toLocaleString()}`,
        message: emailBody,
        email: session.customer_email,
        name: metadata.customer_name
      })
    });

    const receiptUrl = session.payment_intent?.latest_charge?.receipt_url;

    if (receiptUrl) {
      return res.redirect(receiptUrl);
    } else {
      return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
    }
  } catch (error) {
    console.error('Error:', error);
    return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
  }
}
