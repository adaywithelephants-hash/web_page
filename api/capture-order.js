const PAYPAL_CLIENT_ID = 'Aeiumjsj90kuX2tHy9z1UH3fOpkm9OdpkhM4t2dJSwdvzay4seX50fCTouZBiTpNrxi0OUmbsW29Ryod';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  
  const data = await response.json();
  return data.access_token;
}

export default async function handler(req, res) {
  const { token, meta } = req.query;

  if (!token) {
    return res.redirect('https://www.adaywithelephants.com/?payment=error');
  }

  try {
    const accessToken = await getAccessToken();

    const captureResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureResponse.json();
    console.log('Capture response:', captureData.status);

    if (captureData.status === 'COMPLETED') {
      let metadata = {};
      
      try {
        metadata = JSON.parse(Buffer.from(decodeURIComponent(meta), 'base64').toString('utf8'));
      } catch {
        metadata = {};
      }

      const amount = metadata.amount_thb || 0;
      const paymentType = metadata.payment_type === 'deposit' ? 'DEPOSIT' : 'FULL PAYMENT';

      const emailBody = `
NEW BOOKING PAYMENT

${paymentType}
Amount: ${amount.toLocaleString()} THB
PayPal

Customer Information:
- Name: ${metadata.customer_name || 'N/A'}
- Email: ${metadata.customer_email || 'N/A'}
- Phone: ${metadata.customer_phone || 'Not specified'}
- Country: ${metadata.country || 'Not specified'}

Tour Details:
- Package: ${metadata.tour_package || 'N/A'}
- Date: ${metadata.tour_date || 'N/A'}
- Adults: ${metadata.adults || '0'}
- Children: ${metadata.children || '0'}

Hotel: ${metadata.hotel || 'Not specified'}

Special Requests:
${metadata.special_requests || 'None'}
      `.trim();

      await fetch('https://formspree.io/f/mzdgawqp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          subject: `PAID! ${paymentType} - ${metadata.customer_name} - ${amount.toLocaleString()} THB (PayPal)`,
          message: emailBody,
          email: metadata.customer_email,
          name: metadata.customer_name
        })
      });

      const receiptParams = new URLSearchParams({
        name: metadata.customer_name || '',
        email: metadata.customer_email || '',
        phone: metadata.customer_phone || '',
        package: metadata.tour_package || '',
        date: metadata.tour_date || '',
        adults: metadata.adults || '0',
        children: metadata.children || '0',
        hotel: metadata.hotel || '',
        amount: amount.toString(),
        type: metadata.payment_type || 'deposit',
        method: 'paypal',
        charge: token.substring(0, 20) || ''
      });

      return res.redirect(`https://www.adaywithelephants.com/receipt.html?${receiptParams.toString()}`);

    } else {
      console.error('Payment not completed:', captureData);
      return res.redirect('https://www.adaywithelephants.com/?payment=error');
    }

  } catch (error) {
    console.error('Capture error:', error);
    return res.redirect('https://www.adaywithelephants.com/?payment=error');
  }
}
