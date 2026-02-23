const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
      paymentMethod, 
      paymentType,
      customerEmail, 
      customerName, 
      tourPackage, 
      tourDate, 
      adults,
      children,
      country,
      hotel, 
      message 
    } = req.body;

    if (!adults || parseInt(adults) < 1) {
      return res.status(400).json({ error: 'Invalid number of adults' });
    }

    const paymentMethods = paymentMethod === 'promptpay' 
      ? ['promptpay'] 
      : ['card'];

    let line_items = [];

    if (paymentType === 'deposit') {
      const totalPeople = parseInt(adults) + parseInt(children);
      line_items.push({
        price_data: {
          currency: 'thb',
          product_data: {
            name: 'Elephant Tour Deposit',
            description: 'Deposit per person',
          },
          unit_amount: 500 * 100,
        },
        quantity: totalPeople,
      });
    } else {
      const packagePrices = {
        'Half Day Morning - 1,600 THB': { adult: 1600, child: 1000 },
        'Half Day Afternoon - 1,600 THB': { adult: 1600, child: 1000 },
        'Full Day - 2,500 THB': { adult: 2500, child: 1500 }
      };
      const prices = packagePrices[tourPackage] || { adult: 1600, child: 1000 };
      
      if (parseInt(adults) > 0) {
        line_items.push({
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'Elephant Tour - Adult',
              description: tourPackage,
            },
            unit_amount: prices.adult * 100,
          },
          quantity: parseInt(adults),
        });
      }
      
      if (parseInt(children) > 0) {
        line_items.push({
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'Elephant Tour - Child (4-9 yrs)',
              description: tourPackage,
            },
            unit_amount: prices.child * 100,
          },
          quantity: parseInt(children),
        });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      line_items: line_items,
      mode: 'payment',
      success_url: 'https://web-page-eight-green.vercel.app/api/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://web-page-eight-green.vercel.app/?payment=cancelled',
      customer_email: customerEmail,
      metadata: {
        customer_name: customerName,
        customer_phone: req.body.phone || '',
        tour_package: tourPackage,
        tour_date: tourDate,
        adults: adults.toString(),
        children: children.toString(),
        country: country || '',
        hotel: hotel || '',
        special_requests: message || '',
        payment_type: paymentType,
        payment_method: paymentMethod,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
