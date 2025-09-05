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
      SpeechResult: 'Emma' // Force Emma request for testing
    };

    console.log('🧪 TEST ENDPOINT - Forcing Emma routing test');
    console.log('- Caller:', payload.From);
    console.log('- Emma target:', process.env.EMMA_PHONE);
    
    const twimlResponse = await CallOrchestrator.processSpeechInput(payload);
    
    return new NextResponse(twimlResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    
    const fallbackResponse = '<Response><Say>Test failed</Say><Hangup/></Response>';
    
    return new NextResponse(fallbackResponse, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}