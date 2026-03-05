const Omise = require('omise')({
  publicKey: 'pkey_test_66wj2oh7843txj7w1j8',
  secretKey: process.env.OMISE_SECRET_KEY,
});

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
    const { chargeId } = req.body;

    if (!chargeId) {
      return res.status(400).json({ error: 'Charge ID required' });
    }

    const charge = await Omise.charges.retrieve(chargeId);

    return res.status(200).json({
      status: charge.status,
      paid: charge.paid,
      metadata: charge.metadata,
      amount: charge.amount / 100,
    });

  } catch (error) {
    console.error('Omise error:', error);
    res.status(500).json({ error: error.message });
  }
}
