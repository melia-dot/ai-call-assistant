import { NextRequest, NextResponse } from 'next';
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';
import { DatabaseService } from '@/services/database';
import { TwilioService } from '@/services/twilio';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    // Log incoming call to database
    await DatabaseService.logCall({
      callSid,
      from,
      to,
      status: 'incoming',
      timestamp: new Date()
    });

    // Generate greeting with compliance notice
    const response = TwilioService.generateGreeting();
    
    return new NextResponse(response, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Voice webhook error:', error);
    
    // Fallback response
    const resp = new VoiceResponse();
    resp.say('Sorry, we are experiencing technical difficulties. Please try again later.');
    resp.hangup();
    
    return new NextResponse(resp.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}