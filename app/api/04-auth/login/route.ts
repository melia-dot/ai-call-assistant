import { NextRequest, NextResponse } from 'next';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Hardcoded admin credentials
    const validUsername = 'admin';
    const validPassword = process.env.ADMIN_PASSWORD!;

    if (username === validUsername && password === validPassword) {
      // Create session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // TODO: Store session in database or use iron-session
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Login successful' 
      });
      
      response.cookies.set('auth-session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        path: '/'
      });

      return response;
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid credentials' 
    }, { status: 401 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error' 
    }, { status: 500 });
  }
}