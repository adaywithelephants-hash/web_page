const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { session_id } = req.query;

  console.log('Success API called, session_id:', session_id);

  if (!session_id) {
    console.log('No session_id, redirecting to success page');
    return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
  }

  try {
    console.log('Retrieving session from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent.latest_charge', 'line_items']
    });

    console.log('Session retrieved, metadata:', session.metadata);

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

    console.log('Sending email via Formspree...');
    
    const formspreeResponse = await fetch('https://formspree.io/f/mzdgawqp', {
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

    console.log('Formspree response status:', formspreeResponse.status);
    const formspreeResult = await formspreeResponse.text();
    console.log('Formspree response body:', formspreeResult);

    const receiptUrl = session.payment_intent?.latest_charge?.receipt_url;
    console.log('Receipt URL:', receiptUrl);

    if (receiptUrl) {
      return res.redirect(receiptUrl);
    } else {
      return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
    }
  } catch (error) {
    console.error('Error in success API:', error);
    return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
  }
}
