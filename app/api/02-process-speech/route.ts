import { NextRequest, NextResponse } from 'next';
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';
import { ClaudeService } from '../../../services/claude';
import { DatabaseService } from '../../../services/database';
import { TwilioService } from '../../../services/twilio';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const speechResult = formData.get('SpeechResult') as string;
    const from = formData.get('From') as string;
    const dialCallStatus = formData.get('DialCallStatus') as string;

    // Handle call routing failures
    if (dialCallStatus && ['busy', 'no-answer', 'failed'].includes(dialCallStatus)) {
      await DatabaseService.updateCall(callSid, {
        outcome: 'routing_failed',
        status: dialCallStatus
      });

      const response = TwilioService.generateSpeechPrompt(
        'Sorry, we couldn\'t connect you. Please leave a brief message and we\'ll get back to you.'
      );
      
      return new NextResponse(response, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Process speech input
    if (speechResult) {
      const analysis = await ClaudeService.analyzeIntent(speechResult);

      // Update call log with transcript and intent
      await DatabaseService.updateCall(callSid, {
        transcript: speechResult,
        intent: analysis.intent,
        callerName: analysis.callerName
      });

      let response: string;

      switch (analysis.intent) {
        case 'emma_request':
          response = this.handleEmmaRequest(from);
          break;
        
        case 'sales_general':
          response = this.handleSalesInquiry();
          break;
        
        case 'business_general':
          response = this.handleBusinessInquiry(from, analysis.callerName);
          break;
        
        case 'nonsense':
          await DatabaseService.updateCall(callSid, { outcome: 'filtered' });
          response = TwilioService.hangupCall('Thank you for calling NuVance Labs.');
          break;
        
        default:
          response = TwilioService.generateSpeechPrompt(
            'Could you please clarify what you\'re calling about? Are you looking for Emma, Michael, or have a sales inquiry?'
          );
      }

      return new NextResponse(response, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Fallback response
    const resp = new VoiceResponse();
    resp.say('I didn\'t catch that. Please try again.');
    resp.redirect('/api/01-voice');
    
    return new NextResponse(resp.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Process speech error:', error);
    
    const resp = new VoiceResponse();
    resp.say('Sorry, we are experiencing technical difficulties.');
    resp.hangup();
    
    return new NextResponse(resp.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

function handleEmmaRequest(callerNumber: string): string {
  const emmaPhone = process.env.EMMA_PHONE!;
  return TwilioService.routeCall(emmaPhone, callerNumber);
}

function handleSalesInquiry(): string {
  return TwilioService.generateSpeechPrompt(
    'I need to book you a callback for our sales team. What day and time would work best for you?'
  );
}

function handleBusinessInquiry(callerNumber: string, callerName?: string): string {
  const michaelPhone = process.env.MICHAEL_PHONE!;
  
  // Generate screening message for Michael
  const screeningMessage = callerName 
    ? `I have ${callerName} on the line` 
    : `I have an unknown caller on the line`;
  
  return TwilioService.routeCall(michaelPhone, callerNumber);
}