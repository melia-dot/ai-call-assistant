export interface TwilioPayload {
  CallSid: string;
  From: string;
  To: string;
  SpeechResult?: string;
  CallStatus?: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'no-answer' | 'failed' | 'canceled';
  DialCallStatus?: 'completed' | 'busy' | 'no-answer' | 'failed' | 'canceled';
  RecordingUrl?: string;
}

export interface CallLog {
  id?: number;
  callSid: string;
  from: string;
  to: string;
  callerName?: string;
  intent?: string;
  transcript?: string;
  outcome: string;
  duration?: number;
  status: string;
  timestamp: Date;
  recordingUrl?: string;
}