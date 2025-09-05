import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('auth-session');
    
    if (!sessionCookie || !sessionCookie.value) {
      console.log('❌ No auth session - redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('✅ Auth session found - allowing dashboard access');
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
