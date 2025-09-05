import Anthropic from '@anthropic-ai/sdk';
import { ClaudeResponse } from '../types/claude';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export class ClaudeService {
  static async analyzeIntent(transcript: string): Promise<ClaudeResponse> {
    console.log('Analyzing transcript:', transcript);
    
    // Pre-check for obvious Emma requests to avoid API failure
    const lowerTranscript = transcript.toLowerCase().trim();
    if (lowerTranscript === 'emma' || lowerTranscript === 'ema' || 
        lowerTranscript.includes('i want emma') || lowerTranscript.includes('speak to emma') ||
        lowerTranscript.includes('talk to emma') || lowerTranscript.includes('get emma')) {
      console.log('Direct Emma request detected');
      return {
        intent: 'emma_request',
        confidence: 0.95,
        response: this.generateResponse('emma_request'),
        callerName: this.extractName(transcript)
      };
    }
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `CALL ROUTING ANALYSIS

Caller transcript: "${transcript}"

IMPORTANT RULES:
- If caller mentions "Emma" by name = emma_request
- If caller mentions "Michael" by name = business_general  
- Government/tax/official business = business_general
- Sales/pricing inquiries = sales_general
- Gibberish/testing = nonsense
- Unclear requests = unclear

Respond with ONLY this exact JSON format:
{"intent": "emma_request", "confidence": 0.9, "reasoning": "caller said Emma"}`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        console.log('Claude raw response:', content.text);
        
        // Extract JSON more robustly
        let jsonText = content.text.trim();
        
        // Try multiple JSON extraction methods
        let jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          jsonMatch = jsonText.match(/\{.*\}/);
        }
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        try {
          const analysis = JSON.parse(jsonText);
          console.log('Parsed Claude analysis:', analysis);
          
          return {
            intent: analysis.intent,
            confidence: analysis.confidence || 0.8,
            response: this.generateResponse(analysis.intent),
            callerName: analysis.callerName
          };
        } catch (parseError) {
          console.error('JSON parse failed:', parseError, 'Attempting fallback...');
          return this.intelligentFallback(transcript);
        }
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Claude API failed:', error, 'Using fallback analysis');
      return this.intelligentFallback(transcript);
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

  private static intelligentFallback(transcript: string): ClaudeResponse {
    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('Using intelligent fallback for:', lowerTranscript);
    
    // Emma variations
    if (lowerTranscript.includes('emma') || lowerTranscript.includes('ema')) {
      console.log('Fallback: Emma request detected');
      return {
        intent: 'emma_request',
        confidence: 0.9,
        response: this.generateResponse('emma_request'),
        callerName: this.extractName(transcript)
      };
    }
    
    // Michael variations
    if (lowerTranscript.includes('michael') || lowerTranscript.includes('mike')) {
      console.log('Fallback: Michael request detected');
      return {
        intent: 'business_general',
        confidence: 0.9,
        response: this.generateResponse('business_general'),
        callerName: this.extractName(transcript)
      };
    }
    
    // Business/official terms
    if (lowerTranscript.includes('tax') || lowerTranscript.includes('business') || 
        lowerTranscript.includes('official') || lowerTranscript.includes('government')) {
      console.log('Fallback: Business request detected');
      return {
        intent: 'business_general',
        confidence: 0.8,
        response: this.generateResponse('business_general')
      };
    }
    
    // Sales terms
    if (lowerTranscript.includes('sales') || lowerTranscript.includes('buy') || 
        lowerTranscript.includes('price') || lowerTranscript.includes('quote')) {
      console.log('Fallback: Sales request detected');
      return {
        intent: 'sales_general',
        confidence: 0.8,
        response: this.generateResponse('sales_general')
      };
    }
    
    // Very short or gibberish
    if (lowerTranscript.length < 3 || lowerTranscript.includes('test')) {
      console.log('Fallback: Nonsense detected');
      return {
        intent: 'nonsense',
        confidence: 0.7,
        response: this.generateResponse('nonsense')
      };
    }
    
    console.log('Fallback: Truly unclear');
    return {
      intent: 'unclear',
      confidence: 0.4,
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