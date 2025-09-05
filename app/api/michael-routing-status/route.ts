import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/database';
import { TwilioService } from '@/services/twilio';

export async function POST(req: NextRequest) {
  try {
    console.log('📞 MICHAEL ROUTING STATUS WEBHOOK');
    
    const body = await req.text();
    const params = new URLSearchParams(body);
    
    const callSid = params.get('CallSid');
    const dialCallStatus = params.get('DialCallStatus');
    const from = params.get('From');
    
    console.log('Michael routing result:', {
      callSid,
      dialCallStatus,
      from
    });
    
    if (!callSid) {
      return new Response('<Response></Response>', {
        headers: { 'Content-Type': 'application/xml' }
      });
    }
    
    if (dialCallStatus === 'completed' || dialCallStatus === 'answered') {
      // Success - Michael answered
      console.log('✅ MICHAEL ROUTING SUCCESS');
      await DatabaseService.updateCall(callSid, {
        outcome: 'michael_routed',
        status: 'connected'
      });
      
      return new Response('<Response></Response>', {
        headers: { 'Content-Type': 'application/xml' }
      });
    } else {
      // Failed - take message as final fallback
      console.log('❌ MICHAEL ROUTING FAILED - taking message');
      await DatabaseService.updateCall(callSid, {
        outcome: 'michael_failed_taking_message',
        status: 'taking_message'
      });
      
      const twiml = TwilioService.takeMessage();
      
      return new Response(twiml, {
        headers: { 'Content-Type': 'application/xml' }
      });
    }
    
  } catch (error) {
    console.error('❌ Michael routing status error:', error);
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}
