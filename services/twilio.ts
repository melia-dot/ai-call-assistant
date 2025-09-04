import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { TwilioPayload } from '../types/twilio';

export class TwilioService {
  static generateGreeting(): string {
    const resp = new VoiceResponse();
    
    // UK compliance requirement
    resp.say('This call may be recorded and transcribed for service purposes.');
    resp.pause({ length: 1 });
    
    // Main greeting
    resp.say('Welcome to NuVance Labs. Who would you like to speak with, Emma or Michael?');
    
    // Gather speech input
    resp.gather({
      input: ['speech'],
      action: '/api/02-process-speech',
      timeout: 5,
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
    
    // Prevent routing to same number
    if (phoneNumber === callerNumber) {
      resp.say('Cannot route call to the same number.');
      resp.hangup();
      return resp.toString();
    }

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