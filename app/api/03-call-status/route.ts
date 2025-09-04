import { NextRequest, NextResponse } from 'next/server';
import { CallOrchestrator } from '../../../orchestrators/call-orchestrator';
import { TwilioPayload } from '../../../types/twilio';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const payload: TwilioPayload = {
      CallSid: formData.get('CallSid') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      CallStatus: formData.get('CallStatus') as any,
      CallDuration: formData.get('CallDuration') as string,
      RecordingUrl: formData.get('RecordingUrl') as string
    };

    const twimlResponse = await CallOrchestrator.handleCallStatus(payload);
    
    return new NextResponse(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Call status webhook error:', error);
    
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}