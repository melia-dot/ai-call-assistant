import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../services/database';
import { TwilioService } from '../../../services/twilio';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Extract ALL webhook data for debugging
    const webhookData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      webhookData[key] = value;
    }
    
    console.log('🔍 FULL WEBHOOK PAYLOAD:', JSON.stringify(webhookData, null, 2));
    
    // Check specifically for dial-related parameters
    const dialStatus = formData.get('DialCallStatus') as string;
    const dialDuration = formData.get('DialCallDuration') as string;
    const dialCallSid = formData.get('DialCallSid') as string;
    const dialedNumber = formData.get('DialedNumber') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callSid = formData.get('CallSid') as string;
    
    console.log('📞 DIAL STATUS ANALYSIS:');
    console.log('- DialCallStatus:', dialStatus);
    console.log('- DialCallDuration:', dialDuration);
    console.log('- DialCallSid:', dialCallSid);
    console.log('- DialedNumber:', dialedNumber);
    console.log('- CallStatus:', callStatus);
    console.log('- CallSid:', callSid);
    
    // Log Emma phone number for verification
    console.log('- EMMA_PHONE env:', process.env.EMMA_PHONE);
    
    // Handle dial failures - route to fallback
    if (dialStatus && ['busy', 'no-answer', 'failed'].includes(dialStatus)) {
      console.log(`❌ DIAL FAILED: ${dialStatus} - Routing to fallback`);
      
      // Update database
      if (callSid) {
        await DatabaseService.updateCall(callSid, {
          outcome: 'dial_failed',
          status: dialStatus
        });
      }
      
      // Check if this was an Emma call attempt
      const emmaPhone = process.env.EMMA_PHONE;
      if (dialedNumber === emmaPhone) {
        console.log('🚨 EMMA ROUTING FAILURE DETECTED:');
        console.log('- Target:', emmaPhone);
        console.log('- Failure reason:', dialStatus);
        console.log('- Attempting Michael fallback...');
        
        const michaelPhone = process.env.MICHAEL_PHONE;
        
        if (michaelPhone && michaelPhone !== emmaPhone) {
          console.log('🔄 Routing to Michael:', michaelPhone);
          return new NextResponse(TwilioService.routeCall(michaelPhone, 'fallback'), {
            headers: { 'Content-Type': 'text/xml' }
          });
        } else {
          console.log('📞 No Michael available - taking message');
          return new NextResponse(TwilioService.takeMessage(), {
            headers: { 'Content-Type': 'text/xml' }
          });
        }
      }
      
      // For other failed dials (Michael, etc), take a message
      console.log('📞 Other routing failure - taking message');
      return new NextResponse(TwilioService.takeMessage(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }
    
    // For successful dials or other statuses, just acknowledge
    console.log('✅ Dial completed or in progress');
    return new NextResponse('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('❌ Debug webhook error:', error);
    // Fallback to taking a message on error
    return new NextResponse(TwilioService.takeMessage(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}