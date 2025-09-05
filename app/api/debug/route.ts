import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const dbConfigured = !!process.env.DATABASE_URL;
    const claudeConfigured = !!process.env.ANTHROPIC_API_KEY;
    const twilioConfigured = !!process.env.TWILIO_ACCOUNT_SID;
    
    return NextResponse.json({
      environment: {
        database: dbConfigured,
        claude: claudeConfigured,
        twilio: twilioConfigured,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
