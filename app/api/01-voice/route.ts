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
      CallStatus: formData.get('CallStatus') as any
    };

    const twimlResponse = await CallOrchestrator.handleIncomingCall(payload);
    
    return new NextResponse(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Voice webhook error:', error);
    
    const fallbackResponse = '<Response><Say>Sorry, we are experiencing technical difficulties. Please try again later.</Say><Hangup/></Response>';
    
    return new NextResponse(fallbackResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}