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
    
    console.log(`Attempting to route call from ${callerNumber} to ${phoneNumber}`);
    
    // Prevent routing to same number
    if (phoneNumber === callerNumber) {
      console.log('BLOCKED: Cannot route call to same number');
      resp.say('Cannot route call to the same number.');
      resp.hangup();
      return resp.toString();
    }

    console.log('Routing call via Twilio dial');
    resp.dial(phoneNumber);
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
    resp.say('Please leave a brief message with your name and reason for calling after the beep.');
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