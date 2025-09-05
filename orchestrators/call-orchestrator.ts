import { ClaudeService } from '../services/claude';
import { DatabaseService } from '../services/database';
import { TwilioService } from '../services/twilio';
import { TwilioPayload } from '../types/twilio';

// Simple in-memory store for SSE clients
let sseClients: Response[] = [];

export function addSSEClient(response: Response) {
  sseClients.push(response);
}

export function removeSSEClient(response: Response) {
  sseClients = sseClients.filter(client => client !== response);
}

export function broadcastUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('SSE broadcast error:', error);
    }
  });
}

export class CallOrchestrator {
  static async handleIncomingCall(payload: TwilioPayload): Promise<string> {
    broadcastUpdate({
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

    broadcastUpdate({
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
      return TwilioService.generateSpeechPrompt(
        'I didn\'t catch that. Please try again.'
      );
    }

    // Analyze intent with Claude
    const analysis = await ClaudeService.analyzeIntent(SpeechResult);

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
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = payload;

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