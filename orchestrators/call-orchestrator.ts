import { ClaudeService } from '../services/claude';
import { DatabaseService } from '../services/database';
import { TwilioService } from '../services/twilio';
import { SmartRoutingService } from '../services/smart-routing';
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

    // Route based on intent using SmartRoutingService
    return SmartRoutingService.routeByIntent(analysis.intent, CallSid, From, analysis.callerName);
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
}