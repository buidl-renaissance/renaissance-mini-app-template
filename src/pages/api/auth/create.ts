import type { NextApiRequest, NextApiResponse } from 'next';

const RENAISSANCE_API_URL = process.env.RENAISSANCE_API_URL || 'https://api.renaissance.city';

/**
 * Create a new Renaissance account
 * POST /api/auth/create
 * Body: { username, name, phone, email? }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, name, phone, email } = req.body as {
      username?: string;
      name?: string;
      phone?: string;
      email?: string;
    };

    // Validation
    const errors: Record<string, string> = {};

    if (!username?.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!name?.trim()) {
      errors.name = 'Name is required';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    console.log('📝 [CREATE] Creating Renaissance account:', { username, name, phone: phone?.slice(-4) });

    // Proxy to Renaissance API
    const response = await fetch(`${RENAISSANCE_API_URL}/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username!.trim().toLowerCase(),
        displayName: name!.trim(),
        phone,
        email: email?.trim() || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [CREATE] Renaissance API error:', data);
      
      // Map API errors to form fields
      if (data.code === 'USERNAME_TAKEN') {
        return res.status(400).json({ errors: { username: 'This username is already taken' } });
      }
      if (data.code === 'PHONE_TAKEN') {
        return res.status(400).json({ errors: { phone: 'This phone number is already registered' } });
      }
      if (data.code === 'EMAIL_TAKEN') {
        return res.status(400).json({ errors: { email: 'This email is already registered' } });
      }
      
      return res.status(response.status).json({ 
        error: data.message || 'Failed to create account' 
      });
    }

    console.log('✅ [CREATE] Account created, OTP sent');

    return res.status(200).json({
      success: true,
      message: 'Account created. Verification code sent.',
    });
  } catch (error) {
    console.error('❌ [CREATE] Error creating account:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
