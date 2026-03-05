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
    const { 
      paymentMethod, 
      paymentType,
      token,
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

    if (!adults || parseInt(adults) < 1) {
      return res.status(400).json({ error: 'Invalid number of adults' });
    }

    const packagePrices = {
      'Half Day Morning - 1,600 THB': { adult: 1600, child: 1000 },
      'Half Day Afternoon - 1,600 THB': { adult: 1600, child: 1000 },
      'Full Day - 2,500 THB': { adult: 2500, child: 1500 }
    };

    let amount;
    let description;
    const totalPeople = parseInt(adults) + parseInt(children);

    if (paymentType === 'deposit') {
      amount = totalPeople * 500 * 100;
      description = `Elephant Tour Deposit - ${totalPeople} people`;
    } else {
      const prices = packagePrices[tourPackage] || { adult: 1600, child: 1000 };
      amount = ((parseInt(adults) * prices.adult) + (parseInt(children) * prices.child)) * 100;
      description = `Elephant Tour Full Payment - ${adults} Adult(s), ${children} Child(ren)`;
    }

    const metadata = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: phone || '',
      tour_package: tourPackage,
      tour_date: tourDate,
      adults: adults.toString(),
      children: children.toString(),
      country: country || '',
      hotel: hotel || '',
      special_requests: message || '',
      payment_type: paymentType,
      payment_method: paymentMethod,
    };

    if (paymentMethod === 'promptpay') {
      console.log('Creating PromptPay source, amount:', amount);
      
      try {
        const source = await Omise.sources.create({
          type: 'promptpay',
          amount: amount,
          currency: 'thb',
        });

        console.log('Source created:', JSON.stringify(source, null, 2));

        const charge = await Omise.charges.create({
          amount: amount,
          currency: 'thb',
          source: source.id,
          description: description,
          metadata: metadata,
        });

        console.log('Charge created:', charge.id, 'status:', charge.status);

        let qrCodeUrl = source.scannable_code?.image?.download_uri;
        
        if (!qrCodeUrl && charge.source?.scannable_code?.image?.download_uri) {
          qrCodeUrl = charge.source.scannable_code.image.download_uri;
        }

        if (!qrCodeUrl) {
          const retrievedCharge = await Omise.charges.retrieve(charge.id);
          qrCodeUrl = retrievedCharge.source?.scannable_code?.image?.download_uri;
          console.log('Retrieved charge source:', JSON.stringify(retrievedCharge.source, null, 2));
        }
        
        if (!qrCodeUrl) {
          console.error('No QR code URL found anywhere');
          return res.status(500).json({ 
            error: 'PromptPay QR code not available. Please enable PromptPay in Omise Dashboard or contact support.',
            debug: {
              sourceId: source.id,
              chargeId: charge.id,
              chargeStatus: charge.status
            }
          });
        }

        return res.status(200).json({ 
          type: 'promptpay',
          qrCode: qrCodeUrl,
          amount: amount / 100,
          chargeId: charge.id,
        });
      } catch (sourceError) {
        console.error('PromptPay error:', sourceError);
        return res.status(500).json({ error: sourceError.message });
      }

    } else {
      if (!token) {
        return res.status(400).json({ error: 'Card token required' });
      }

      const charge = await Omise.charges.create({
        amount: amount,
        currency: 'thb',
        card: token,
        description: description,
        metadata: metadata,
        return_uri: `https://web-page-eight-green.vercel.app/api/success?charge_id=${encodeURIComponent(JSON.stringify(metadata))}`,
      });

      if (charge.status === 'pending' && charge.authorize_uri) {
        return res.status(200).json({ 
          type: 'redirect',
          url: charge.authorize_uri,
        });
      } else if (charge.status === 'successful') {
        return res.status(200).json({ 
          type: 'success',
          chargeId: charge.id,
        });
      } else {
        return res.status(400).json({ error: charge.failure_message || 'Payment failed' });
      }
    }

  } catch (error) {
    console.error('Omise error:', error);
    res.status(500).json({ error: error.message });
  }
}
