import { NextRequest, NextResponse } from 'next/server';
import { SmartRoutingService } from '../../../../services/smart-routing';
import { DatabaseService } from '../../../../services/database';

export async function POST(req: NextRequest) {
  try {
    console.log('📞 EMMA ROUTING STATUS WEBHOOK');
    
    const body = await req.text();
    const params = new URLSearchParams(body);
    
    const callSid = params.get('CallSid');
    const dialCallStatus = params.get('DialCallStatus');
    const from = params.get('From');
    const to = params.get('To');
    
    console.log('Emma routing result:', {
      callSid,
      dialCallStatus,
      from,
      to
    });
    
    if (!callSid) {
      return new Response('<Response></Response>', {
        headers: { 'Content-Type': 'application/xml' }
      });
    }
    
    if (dialCallStatus === 'completed' || dialCallStatus === 'answered') {
      // Success - Emma answered
      console.log('✅ EMMA ROUTING SUCCESS');
      await DatabaseService.updateCall(callSid, {
        outcome: 'emma_routed',
        status: 'connected'
      });
      
      // Return empty response - call is connected
      return new Response('<Response></Response>', {
        headers: { 'Content-Type': 'application/xml' }
      });
    } else {
      // Failed - fallback to Michael
      console.log('❌ EMMA ROUTING FAILED - falling back to Michael');
      await DatabaseService.updateCall(callSid, {
        outcome: 'emma_failed_routing_to_michael',
        status: 'routing'
      });
      
      const michaelPhone = process.env.MICHAEL_PHONE!;
      if (michaelPhone && michaelPhone !== from) {
        const { TwilioService } = await import('../../../../services/twilio');
        const twiml = TwilioService.routeCallWithFallback(michaelPhone, from!, '/api/michael-routing-status');
        
        return new Response(twiml, {
          headers: { 'Content-Type': 'application/xml' }
        });
      } else {
        // Take message as final fallback
        const { TwilioService } = await import('../../../../services/twilio');
        const twiml = TwilioService.takeMessage();
        
        return new Response(twiml, {
          headers: { 'Content-Type': 'application/xml' }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Emma routing status error:', error);
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}
