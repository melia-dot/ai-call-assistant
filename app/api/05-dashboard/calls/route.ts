import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../services/database';
import { AuthService } from '../../../../services/auth-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const authError = await AuthService.requireAuth(req);
    if (authError) return authError;
    
    const searchParams = req.nextUrl.searchParams;
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