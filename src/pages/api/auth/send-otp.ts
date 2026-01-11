import type { NextApiRequest, NextApiResponse } from 'next';

const RENAISSANCE_API_URL = process.env.RENAISSANCE_API_URL || 'https://api.renaissance.city';

/**
 * Send OTP to phone number for sign-in
 * POST /api/auth/send-otp
 * Body: { phone }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body as { phone?: string };

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });
    }

    console.log('📱 [SEND-OTP] Sending OTP to:', phone.slice(-4));

    // Proxy to Renaissance API
    const response = await fetch(`${RENAISSANCE_API_URL}/v1/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [SEND-OTP] Renaissance API error:', data);
      
      if (data.code === 'USER_NOT_FOUND') {
        return res.status(404).json({ 
          error: 'No account found with this phone number. Please create an account.' 
        });
      }
      if (data.code === 'RATE_LIMITED') {
        return res.status(429).json({ 
          error: 'Too many requests. Please wait before trying again.' 
        });
      }
      
      return res.status(response.status).json({ 
        error: data.message || 'Failed to send verification code' 
      });
    }

    console.log('✅ [SEND-OTP] OTP sent successfully');

    return res.status(200).json({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error) {
    console.error('❌ [SEND-OTP] Error sending OTP:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
