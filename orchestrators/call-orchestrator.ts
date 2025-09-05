import { ClaudeService } from '../services/claude';
import { DatabaseService } from '../services/database';
import { TwilioService } from '../services/twilio';
import { TwilioPayload } from '../types/twilio';
import { SSEBroadcaster } from '../services/sse-broadcaster';

export class CallOrchestrator {
  static async handleIncomingCall(payload: TwilioPayload): Promise<string> {
    SSEBroadcaster.broadcast({
      type: 'call_status',
      status: 'Incoming Call',
      message: 'Processing new call from ' + payload.From
    });

    await DatabaseService.logCall({
      callSid: payload.CallSid,
      from: payload.From,
      to: payload.To,
      status: 'incoming',
      outcome: 'processing',
      timestamp: new Date()
    });

    SSEBroadcaster.broadcast({
      type: 'call_status',
      status: 'Answering Call',
      message: 'Playing greeting and gathering speech...'
    });

    return TwilioService.generateGreeting();
  }

  static async processSpeechInput(payload: TwilioPayload): Promise<string> {
    const { CallSid, SpeechResult, From, DialCallStatus } = payload;

    // Handle routing failures first
    if (DialCallStatus && ['busy', 'no-answer', 'failed'].includes(DialCallStatus)) {
      await DatabaseService.updateCall(CallSid, {
        outcome: 'routing_failed',
        status: DialCallStatus
      });
      return TwilioService.takeMessage();
    }

    // Process speech input
    if (!SpeechResult) {
      SSEBroadcaster.broadcast({
        type: 'call_status',
        status: 'Waiting for Speech',
        message: 'No speech detected, prompting caller...'
      });
      
      return TwilioService.generateSpeechPrompt(
        'I didn\'t catch that. Please try again.'
      );
    }

    SSEBroadcaster.broadcast({
      type: 'call_status',
      status: 'Claude Analyzing',
      message: 'AI analyzing caller intent...'
    });

    // Analyze intent with Claude
    const analysis = await ClaudeService.analyzeIntent(SpeechResult);

    SSEBroadcaster.broadcast({
      type: 'call_status',
      status: 'Processing Intent',
      message: `Intent classified as: ${analysis.intent}`
    });
    
    console.log('🧠 CLAUDE ANALYSIS RESULT:');
    console.log('- Intent:', analysis.intent);
    console.log('- Caller name:', analysis.callerName);
    console.log('- Transcript:', SpeechResult);

    // Update call log
    await DatabaseService.updateCall(CallSid, {
      transcript: SpeechResult,
      intent: analysis.intent,
      callerName: analysis.callerName
    });

    // Route based on intent
    return this.routeByIntent(analysis.intent, From, analysis.callerName, CallSid);
  }

  static async handleCallStatus(payload: TwilioPayload): Promise<string> {
    const { CallSid, CallStatus, DialCallStatus, CallDuration, RecordingUrl } = payload;

    console.log('📞 CALL STATUS HANDLER:');
    console.log('- CallSid:', CallSid);
    console.log('- CallStatus:', CallStatus);
    console.log('- DialCallStatus:', DialCallStatus);
    console.log('- Duration:', CallDuration);

    // Handle dial failures in fallback routing
    if (DialCallStatus && ['busy', 'no-answer', 'failed'].includes(DialCallStatus)) {
      console.log(`❌ FALLBACK DIAL ALSO FAILED: ${DialCallStatus}`);
      
      await DatabaseService.updateCall(CallSid, {
        status: DialCallStatus,
        duration: CallDuration ? parseInt(CallDuration) : undefined,
        recordingUrl: RecordingUrl,
        outcome: 'all_routing_failed'
      });
      
      // Final fallback - take a message
      return TwilioService.takeMessage();
    }

    // Standard call completion handling
    await DatabaseService.updateCall(CallSid, {
      status: CallStatus || 'unknown',
      duration: CallDuration ? parseInt(CallDuration) : undefined,
      recordingUrl: RecordingUrl,
      outcome: CallStatus === 'completed' ? 'completed' : 'failed'
    });

    return TwilioService.generateEmptyResponse();
  }

  private static async routeByIntent(
    intent: string, 
    callerNumber: string, 
    callerName?: string,
    callSid?: string
  ): Promise<string> {
    switch (intent) {
      case 'emma_request':
        return this.handleEmmaRequest(callerNumber);
      
      case 'sales_general':
        return this.handleSalesInquiry();
      
      case 'business_general':
        return this.handleBusinessInquiry(callerNumber, callerName);
      
      case 'nonsense':
        if (callSid) {
          await DatabaseService.updateCall(callSid, { outcome: 'filtered' });
        }
        return TwilioService.hangupCall('Thank you for calling NuVance Labs.');
      
      default:
        return TwilioService.generateSpeechPrompt(
          'Could you please clarify what you\'re calling about? Are you looking for Emma, Michael, or have a sales inquiry?'
        );
    }
  }

  private static handleEmmaRequest(callerNumber: string): string {
    const emmaPhone = process.env.EMMA_PHONE!;
    console.log('🎯 EMMA ROUTING ATTEMPT:');
    console.log('- Emma phone:', emmaPhone);
    console.log('- Caller number:', callerNumber);
    console.log('- Environment check:', {
      EMMA_PHONE: !!process.env.EMMA_PHONE,
      MICHAEL_PHONE: !!process.env.MICHAEL_PHONE
    });
    
    if (!emmaPhone) {
      console.error('❌ EMMA_PHONE not configured in environment');
      return TwilioService.generateSpeechPrompt('Sorry, Emma is not available right now. Let me connect you to Michael instead.');
    }
    
    console.log('✅ Generating TwiML for Emma routing');
    return TwilioService.routeCall(emmaPhone, callerNumber);
  }

  private static handleSalesInquiry(): string {
    return TwilioService.generateSpeechPrompt(
      'I need to book you a callback for our sales team. What day and time would work best for you?'
    );
  }

  private static handleBusinessInquiry(callerNumber: string, callerName?: string): string {
    const michaelPhone = process.env.MICHAEL_PHONE!;
    return TwilioService.routeCall(michaelPhone, callerNumber);
  }
}