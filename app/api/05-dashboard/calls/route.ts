import { NextRequest, NextResponse } from 'next';
import { DatabaseService } from '@/services/database';

export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check here
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const calls = await DatabaseService.getCalls(limit, offset);

    return NextResponse.json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        hasMore: calls.length === limit
      }
    });

  } catch (error) {
    console.error('Dashboard calls API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch calls' 
    }, { status: 500 });
  }
}