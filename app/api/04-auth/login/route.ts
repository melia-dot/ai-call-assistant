import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../services/database';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Hardcoded admin credentials
    const validUsername = 'admin';
    const validPassword = process.env.ADMIN_PASSWORD!;

    console.log('🔐 LOGIN ATTEMPT:');
    console.log('- Username:', username);
    console.log('- Valid password configured:', !!validPassword);

    if (username === validUsername && password === validPassword) {
      // Create session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      console.log('✅ Valid credentials - creating session');
      console.log('- Session ID:', sessionId);
      console.log('- Expires at:', expiresAt);

      try {
        // Store session in database
        await DatabaseService.executeQuery(
          'INSERT INTO admin_sessions (session_id, user_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT (session_id) DO UPDATE SET expires_at = $3',
          [sessionId, validUsername, expiresAt]
        );
        console.log('✅ Session stored in database');
      } catch (dbError) {
        console.error('❌ Database session storage failed:', dbError);
        // Continue anyway - auth will work with cookies for now
      }
      
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

    console.log('❌ Invalid credentials');
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid credentials' 
    }, { status: 401 });

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error' 
    }, { status: 500 });
  }
}