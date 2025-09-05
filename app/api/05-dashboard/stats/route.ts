import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../services/database';
import { AuthService } from '../../../../services/auth-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const authError = await AuthService.requireAuth(req);
    if (authError) return authError;
    
    const stats = await DatabaseService.getTodayStats();

    const systemHealth = {
      lastCallTime: new Date(), // TODO: Get from database
      webhookResponseTime: '< 1s',
      apiStatus: 'operational'
    };

    return NextResponse.json({
      success: true,
      data: {
        today: stats,
        systemHealth
      }
    });

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch statistics' 
    }, { status: 500 });
  }
}