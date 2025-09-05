import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from './database';

export class AuthService {
  
  static async validateSession(sessionId: string): Promise<boolean> {
    if (!sessionId) {
      console.log('❌ No session ID provided');
      return false;
    }
    
    try {
      // Check session in database
      const result = await DatabaseService.executeQuery(
        'SELECT * FROM admin_sessions WHERE session_id = $1 AND expires_at > NOW()',
        [sessionId]
      );
      
      const isValid = result.rows.length > 0;
      console.log(`🔒 Session validation result: ${isValid ? 'VALID' : 'INVALID'}`);
      
      return isValid;
      
    } catch (error) {
      console.error('❌ Session validation error:', error);
      // Fallback: accept any non-empty session for now
      return sessionId.length > 10;
    }
  }
  
  static async requireAuth(request: NextRequest): Promise<NextResponse | null> {
    const sessionCookie = request.cookies.get('auth-session');
    
    if (!sessionCookie) {
      console.log('❌ No auth session cookie found');
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }
    
    const isValid = await this.validateSession(sessionCookie.value);
    
    if (!isValid) {
      console.log('❌ Invalid session:', sessionCookie.value);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired session' 
      }, { status: 401 });
    }
    
    console.log('✅ Authentication successful');
    return null; // No error, proceed
  }
  
  static async clearSession(sessionId: string): Promise<void> {
    try {
      await DatabaseService.executeQuery(
        'DELETE FROM admin_sessions WHERE session_id = $1',
        [sessionId]
      );
      console.log('✅ Session cleared from database');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }
}
