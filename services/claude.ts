import Anthropic from '@anthropic-ai/sdk';
import { ClaudeResponse } from '../types/claude';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export class ClaudeService {
  static async analyzeIntent(transcript: string): Promise<ClaudeResponse> {
    // Always use Claude in production - remove mock fallback
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are an intelligent call routing assistant for NuVance Labs.
          
Analyze this caller's request and determine their intent:
          
Caller said: "${transcript}"
          
Routing options:
          - emma_request: Caller specifically wants to speak with Emma (by name)
          - business_general: Any business inquiry, official calls, government matters, tax issues, support needs, etc. - route to Michael
          - sales_general: Sales inquiries, pricing, purchasing - needs callback booking
          - nonsense: Obviously fake/prank calls
          - unclear: Genuinely unclear what they want
          
Think about WHO they want to speak with and WHY they're calling. Government officials, tax offices, business inquiries should go to Michael. Only route to Emma if they specifically ask for her.
          
Respond with ONLY this JSON format:
          {"intent": "category", "confidence": 0.8, "reasoning": "why you chose this", "callerName": "name if mentioned"}`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        // Extract JSON from response
        let jsonText = content.text.trim();
        const jsonMatch = jsonText.match(/\{[^}]+\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        try {
          const analysis = JSON.parse(jsonText);
          console.log('Claude analysis:', analysis);
          return {
            intent: analysis.intent,
            confidence: analysis.confidence || 0.8,
            response: this.generateResponse(analysis.intent),
            callerName: analysis.callerName
          };
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Raw text:', jsonText);
          return this.fallbackAnalysis(transcript);
        }
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Claude API error:', error);
      return this.fallbackAnalysis(transcript);
    }
  }

  private static generateResponse(intent: string): string {
    switch (intent) {
      case 'emma_request':
        return 'I\'ll connect you to Emma now.';
      case 'business_general':
        return 'Let me transfer you to Michael who can help with that.';
      case 'sales_general':
        return 'I\'ll need to book you a callback with our sales team. What time works for you?';
      case 'nonsense':
        return 'Thank you for calling NuVance Labs.';
      default:
        return 'Could you please tell me if you\'d like to speak with Emma, Michael, or what I can help you with today?';
    }
  }

  private static fallbackAnalysis(transcript: string): ClaudeResponse {
    const lowerTranscript = transcript.toLowerCase();
    
    // Only do basic fallback - let Claude handle the reasoning
    if (lowerTranscript.includes('emma')) {
      return {
        intent: 'emma_request',
        confidence: 0.7,
        response: this.generateResponse('emma_request'),
        callerName: this.extractName(transcript)
      };
    }
    
    return {
      intent: 'unclear',
      confidence: 0.3,
      response: this.generateResponse('unclear')
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