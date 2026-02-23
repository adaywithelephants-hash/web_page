const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent.latest_charge']
    });

    const receiptUrl = session.payment_intent?.latest_charge?.receipt_url;

    if (receiptUrl) {
      return res.redirect(receiptUrl);
    } else {
      return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
    }
  } catch (error) {
    console.error('Error retrieving session:', error);
    return res.redirect('https://web-page-eight-green.vercel.app/?payment=success');
  }
}
