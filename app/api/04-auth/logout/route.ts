import { NextRequest, NextResponse } from 'next';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    // Clear session cookie
    response.cookies.delete('auth-session');
    
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error' 
    }, { status: 500 });
  }
}