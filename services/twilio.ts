import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { TwilioPayload } from '../types/twilio';

export class TwilioService {
  static generateGreeting(): string {
    const resp = new VoiceResponse();
    
    // Welcoming greeting first
    resp.say('Welcome to NuVance Labs!');
    resp.pause({ length: 1 });
    
    // UK compliance requirement
    resp.say('This call may be recorded and transcribed for service purposes.');
    resp.pause({ length: 1 });
    
    // Main prompt
    resp.say('Who would you like to speak with today? You can say Emma, Michael, or describe what you need help with.');
    
    // Gather speech input
    resp.gather({
      input: ['speech'],
      action: '/api/02-process-speech',
      timeout: 8,
      speechTimeout: 'auto'
    });
    
    // If no response, try again
    resp.say('I didn\'t catch that. Please say Emma, Michael, or tell me how I can help you.');
    resp.gather({
      input: ['speech'],
      action: '/api/02-process-speech',
      timeout: 8,
      speechTimeout: 'auto'
    });
    
    return resp.toString();
  }

  static generateSpeechPrompt(message: string): string {
    const resp = new VoiceResponse();
    resp.say(message);
    resp.gather({
      input: ['speech'],
      action: '/api/02-process-speech',
      timeout: 5,
      speechTimeout: 'auto'
    });
    return resp.toString();
  }

  static routeCall(phoneNumber: string, callerNumber: string): string {
    const resp = new VoiceResponse();
    
    console.log(`=== CALL ROUTING ATTEMPT ===`);
    console.log(`From: ${callerNumber}`);
    console.log(`To: ${phoneNumber}`);
    console.log(`Numbers match: ${phoneNumber === callerNumber}`);
    
    // Prevent routing to same number
    if (phoneNumber === callerNumber) {
      console.log('❌ BLOCKED: Cannot route call to same number');
      resp.say('Sorry, I cannot route this call to the same number. Please try a different request.');
      resp.hangup();
      return resp.toString();
    }

    console.log('✅ Proceeding with Twilio dial command');
    
    // Different action URL for fallback calls to prevent infinite loops
    const actionUrl = callerNumber === 'fallback' ? '/api/03-call-status' : '/api/debug-webhook';
    
    // Add timeout and status reporting
    const dial = resp.dial({
      timeout: 30,
      action: actionUrl,
      record: 'record-from-ringing'
    });
    dial.number(phoneNumber);
    
    console.log('📞 TwiML generated for dial operation');
    return resp.toString();
  }

  static hangupCall(message?: string): string {
    const resp = new VoiceResponse();
    if (message) {
      resp.say(message);
    }
    resp.hangup();
    return resp.toString();
  }

  static takeMessage(): string {
    const resp = new VoiceResponse();
    resp.say('I\'m sorry, but that person is not available right now. Please leave a brief message with your name and reason for calling after the beep.');
    resp.record({
      action: '/api/03-call-status',
      timeout: 30,
      maxLength: 120
    });
    return resp.toString();
  }

  static generateEmptyResponse(): string {
    return '<Response></Response>';
  }
}