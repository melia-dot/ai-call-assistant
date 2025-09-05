import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../services/database';
import { AuthService } from '../../../../services/auth-service';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('Dashboard: Fetching messages/voicemails...');
    
    // Authentication check
    const authError = await AuthService.requireAuth(req);
    if (authError) return authError;
    
    // Get URL search params for pagination using nextUrl
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get messages/voicemails from database
    // These are calls with recording_url and specific outcomes
    const messages = await DatabaseService.getMessages(limit, offset);
    
    // Format the response
    const formattedMessages = messages.map((call: any) => ({
      id: call.id,
      callSid: call.call_sid,
      from: call.from_number,
      callerName: call.caller_name || 'Unknown',
      timestamp: call.timestamp,
      timeAgo: getTimeAgo(new Date(call.timestamp)),
      recordingUrl: call.recording_url,
      transcript: call.transcript,
      intent: call.intent,
      outcome: call.outcome,
      duration: call.duration
    }));

    return NextResponse.json({
      success: true,
      data: formattedMessages,
      pagination: {
        page,
        limit,
        hasMore: formattedMessages.length === limit
      }
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch messages'
    }, { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}
