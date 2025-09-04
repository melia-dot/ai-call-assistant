import { NextRequest, NextResponse } from 'next';
import { DatabaseService } from '@/services/database';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;

    // Update call log with final status and duration
    await DatabaseService.updateCall(callSid, {
      status: callStatus,
      duration: callDuration ? parseInt(callDuration) : undefined,
      recordingUrl: recordingUrl || undefined,
      outcome: callStatus === 'completed' ? 'completed' : 'failed'
    });

    console.log(`Call ${callSid} ended with status: ${callStatus}`);

    // Return empty TwiML response
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Call status webhook error:', error);
    
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}