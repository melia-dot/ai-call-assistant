import Anthropic from '@anthropic-ai/sdk';
import { ClaudeResponse } from '../types/claude';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export class ClaudeService {
  static async analyzeIntent(transcript: string): Promise<ClaudeResponse> {
    // Mock response for development (to save API costs)
    if (process.env.NODE_ENV === 'development') {
      return this.mockAnalysis(transcript);
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Analyze this call transcript and classify the intent:
          
          Transcript: "${transcript}"
          
          Classify into one of:
          - emma_request: Caller specifically asks for Emma
          - sales_general: Sales inquiry without specific person
          - business_general: General business inquiry
          - nonsense: Prank call or irrelevant content
          - unclear: Need clarification
          
          Extract caller name if mentioned.
          
          Return JSON format:
          {
            "intent": "category",
            "confidence": 0.8,
            "response": "appropriate TTS response",
            "callerName": "name if found"
          }`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Claude API error:', error);
      return this.mockAnalysis(transcript);
    }
  }

  private static mockAnalysis(transcript: string): ClaudeResponse {
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('emma')) {
      return {
        intent: 'emma_request',
        confidence: 0.9,
        response: 'I\'ll connect you to Emma now.',
        callerName: this.extractName(transcript)
      };
    }
    
    if (lowerTranscript.includes('sales') || lowerTranscript.includes('buy') || lowerTranscript.includes('price')) {
      return {
        intent: 'sales_general',
        confidence: 0.8,
        response: 'I need to book you a callback. When would suit you?'
      };
    }
    
    if (lowerTranscript.includes('support') || lowerTranscript.includes('help') || lowerTranscript.includes('business')) {
      return {
        intent: 'business_general',
        confidence: 0.7,
        response: 'Let me connect you to Michael.'
      };
    }
    
    return {
      intent: 'unclear',
      confidence: 0.5,
      response: 'Could you please clarify what you\'re calling about?'
    };
  }

  private static extractName(transcript: string): string | undefined {
    const namePatterns = [
      /my name is ([a-z]+)/i,
      /this is ([a-z]+)/i,
      /i'm ([a-z]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  }
}