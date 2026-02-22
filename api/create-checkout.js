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
    const { quantity, customerEmail, customerName, tourPackage, tourDate, hotel, message } = req.body;

    if (!quantity || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1T3clSJY93jdwpb0CCQv2F9c',
          quantity: parseInt(quantity),
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
        hotel: hotel || '',
        special_requests: message || '',
        total_people: quantity.toString(),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
