const Omise = require('omise')({
  publicKey: 'pkey_test_66wj2oh7843txj7w1j8',
  secretKey: process.env.OMISE_SECRET_KEY,
});

export default async function handler(req, res) {
  const { charge_id } = req.query;

  console.log('Success API called, charge_id:', charge_id);

  if (!charge_id) {
    return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
  }

  try {
    let metadata;
    let amount;
    let customerEmail;

    try {
      metadata = JSON.parse(decodeURIComponent(charge_id));
      const packagePrices = {
        'Half Day Morning - 1,600 THB': { adult: 1600, child: 1000 },
        'Half Day Afternoon - 1,600 THB': { adult: 1600, child: 1000 },
        'Full Day - 2,500 THB': { adult: 2500, child: 1500 }
      };
      const prices = packagePrices[metadata.tour_package] || { adult: 1600, child: 1000 };
      const adults = parseInt(metadata.adults) || 0;
      const children = parseInt(metadata.children) || 0;
      
      if (metadata.payment_type === 'deposit') {
        amount = (adults + children) * 500;
      } else {
        amount = (adults * prices.adult) + (children * prices.child);
      }
      customerEmail = metadata.customer_email;
    } catch {
      const charge = await Omise.charges.retrieve(charge_id);
      metadata = charge.metadata;
      amount = charge.amount / 100;
      customerEmail = metadata.customer_email;
    }

    const paymentType = metadata.payment_type === 'deposit' ? '💰 DEPOSIT (มัดจำ)' : '💎 FULL PAYMENT (จ่ายเต็ม)';
    const paymentMethodText = metadata.payment_method === 'promptpay' ? '🏦 PromptPay' : '💳 Credit/Debit Card';

    const emailBody = `
🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉

    ✅ ลูกค้าจ่ายเงินแล้ว ✅
    ✅ PAYMENT RECEIVED ✅

🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉

🐘 NEW BOOKING PAYMENT!
================================

${paymentType}
💵 Amount: ฿${amount.toLocaleString()}
${paymentMethodText}

👤 Customer Information:
- Name: ${metadata.customer_name}
- Email: ${customerEmail}
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
    `.trim();

    console.log('Sending email via Formspree...');

    const formspreeResponse = await fetch('https://formspree.io/f/mzdgawqp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        subject: `✅ PAID! ${paymentType} - ${metadata.customer_name} - ฿${amount.toLocaleString()} (${paymentMethodText})`,
        message: emailBody,
        email: customerEmail,
        name: metadata.customer_name
      })
    });

    console.log('Formspree response:', formspreeResponse.status);

    const receiptParams = new URLSearchParams({
      name: metadata.customer_name || '',
      email: customerEmail || '',
      phone: metadata.customer_phone || '',
      package: metadata.tour_package || '',
      date: metadata.tour_date || '',
      adults: metadata.adults || '0',
      children: metadata.children || '0',
      hotel: metadata.hotel || '',
      amount: amount.toString(),
      type: metadata.payment_type || 'deposit',
      method: metadata.payment_method || 'promptpay',
      charge: charge_id.substring(0, 20) || ''
    });

    return res.redirect(`https://web-page-eight-green.vercel.app/receipt.html?${receiptParams.toString()}`);

  } catch (error) {
    console.error('Error:', error);
    return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
  }
}
