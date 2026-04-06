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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      paymentType,
      customerEmail, 
      customerName, 
      phone,
      tourPackage, 
      tourDate, 
      adults,
      children,
      country,
      hotel, 
      message 
    } = req.body;

    const packagePrices = {
      'Half Day Morning - 1,600 THB': { adult: 1600, child: 1000 },
      'Half Day Afternoon - 1,600 THB': { adult: 1600, child: 1000 },
      'Full Day - 2,500 THB': { adult: 2500, child: 1500 }
    };

    let amountTHB;
    let description;
    const totalPeople = parseInt(adults) + parseInt(children);

    if (paymentType === 'deposit') {
      amountTHB = totalPeople * 500;
      description = `Deposit ${totalPeople} ppl`;
    } else {
      const prices = packagePrices[tourPackage] || { adult: 1600, child: 1000 };
      amountTHB = (parseInt(adults) * prices.adult) + (parseInt(children) * prices.child);
      description = `Full ${adults}A ${children}C`;
    }

    const exchangeRate = 35;
    const amountUSD = (amountTHB / exchangeRate).toFixed(2);

    const accessToken = await getAccessToken();

    const metadata = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: phone || '',
      tour_package: tourPackage,
      tour_date: tourDate,
      adults: adults,
      children: children,
      country: country || '',
      hotel: hotel || '',
      special_requests: message || '',
      payment_type: paymentType,
      amount_thb: amountTHB,
    };

    const metaParam = Buffer.from(JSON.stringify(metadata)).toString('base64');

    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amountUSD,
          },
          description: description,
        }],
        application_context: {
          brand_name: 'A Day With Elephants',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `https://www.adaywithelephants.com/api/capture-order?meta=${encodeURIComponent(metaParam)}`,
          cancel_url: 'https://www.adaywithelephants.com/?payment=cancelled',
        },
      }),
    });

    const orderData = await orderResponse.json();
    console.log('PayPal order response:', JSON.stringify(orderData));

    const approveUrl = orderData.links?.find(link => link.rel === 'approve')?.href;

    if (approveUrl) {
      return res.status(200).json({ 
        orderID: orderData.id,
        approveUrl: approveUrl,
      });
    } else {
      console.error('PayPal error:', JSON.stringify(orderData));
      return res.status(500).json({ error: 'Failed to create PayPal order', details: orderData });
    }

  } catch (error) {
    console.error('PayPal error:', error);
    res.status(500).json({ error: error.message });
  }
}
