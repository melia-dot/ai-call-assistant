import { NextRequest, NextResponse } from 'next';
import { DatabaseService } from '../../../../services/database';

export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check here
    
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