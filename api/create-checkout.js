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
      amount, 
      description, 
      paymentMethod, 
      paymentType,
      customerEmail, 
      customerName, 
      tourPackage, 
      tourDate, 
      adults,
      children,
      hotel, 
      message 
    } = req.body;

    if (!amount || amount < 500) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentMethods = paymentMethod === 'promptpay' 
      ? ['promptpay'] 
      : ['card'];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: 'A Day With Elephants',
              description: description,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://web-page-eight-green.vercel.app/?payment=success',
      cancel_url: 'https://web-page-eight-green.vercel.app/?payment=cancelled',
      customer_email: customerEmail,
      metadata: {
        customer_name: customerName,
        tour_package: tourPackage,
        tour_date: tourDate,
        adults: adults.toString(),
        children: children.toString(),
        hotel: hotel || '',
        special_requests: message || '',
        payment_type: paymentType,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
