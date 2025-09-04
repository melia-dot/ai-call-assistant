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
      SpeechResult: formData.get('SpeechResult') as string,
      DialCallStatus: formData.get('DialCallStatus') as any
    };

    const twimlResponse = await CallOrchestrator.processSpeechInput(payload);
    
    return new NextResponse(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Process speech error:', error);
    
    const fallbackResponse = '<Response><Say>Sorry, we are experiencing technical difficulties.</Say><Hangup/></Response>';
    
    return new NextResponse(fallbackResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}