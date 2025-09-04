export interface ClaudeResponse {
  intent: 'emma_request' | 'sales_general' | 'business_general' | 'nonsense' | 'unclear';
  confidence: number;
  response: string;
  callerName?: string;
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  extractedInfo: {
    callerName?: string;
    topic?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}