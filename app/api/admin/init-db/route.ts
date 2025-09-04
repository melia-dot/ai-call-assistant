import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../services/database';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await DatabaseService.initializeDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}