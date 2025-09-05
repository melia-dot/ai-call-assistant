import { TwilioService } from './twilio';
import { DatabaseService } from './database';

export class SmartRoutingService {
  // Track routing attempts to prevent infinite loops
  private static routingAttempts: Map<string, number> = new Map();
  
  static async routeByIntent(
    intent: string,
    callSid: string,
    callerNumber: string,
    callerName?: string
  ): Promise<string> {
    const attemptKey = `${callSid}-${intent}`;
    const attempts = this.routingAttempts.get(attemptKey) || 0;
    
    // Prevent infinite routing loops
    if (attempts >= 2) {
      console.log(`❌ Max routing attempts reached for ${callSid}`);
      await DatabaseService.updateCall(callSid, { outcome: 'all_routing_failed' });
      return TwilioService.takeMessage();
    }
    
    this.routingAttempts.set(attemptKey, attempts + 1);
    
    switch (intent) {
      case 'emma_request':
        return await this.tryEmmaRouting(callSid, callerNumber, callerName);
      
      case 'sales_general':
        return await this.handleSalesInquiry(callSid, callerNumber, callerName);
      
      case 'business_general':
        return await this.tryMichaelRouting(callSid, callerNumber, callerName);
      
      case 'nonsense':
        await DatabaseService.updateCall(callSid, { outcome: 'filtered' });
        return TwilioService.hangupCall('Thank you for calling NuVance Labs.');
      
      default:
        return TwilioService.generateSpeechPrompt(
          'Could you please clarify what you\'re calling about? Are you looking for Emma, Michael, or have a sales inquiry?'
        );
    }
  }
  
  private static async tryEmmaRouting(callSid: string, callerNumber: string, callerName?: string): Promise<string> {
    const emmaPhone = process.env.EMMA_PHONE!;
    
    console.log(`🎯 EMMA ROUTING ATTEMPT:`);
    console.log(`- CallSid: ${callSid}`);
    console.log(`- Emma: ${emmaPhone}`);
    console.log(`- Caller: ${callerNumber}`);
    
    if (!emmaPhone) {
      console.error('❌ EMMA_PHONE not configured');
      return await this.fallbackToMichael(callSid, callerNumber, callerName, 'emma_unavailable');
    }
    
    // Prevent self-routing
    if (emmaPhone === callerNumber) {
      console.error('❌ Cannot route Emma to herself');
      return await this.fallbackToMichael(callSid, callerNumber, callerName, 'self_routing_blocked');
    }
    
    await DatabaseService.updateCall(callSid, { 
      outcome: 'attempting_emma_routing',
      status: 'routing'
    });
    
    // Generate TwiML with specific action URL for Emma routing
    return TwilioService.routeCallWithFallback(emmaPhone, callerNumber, '/api/emma-routing-status');
  }
  
  private static async tryMichaelRouting(callSid: string, callerNumber: string, callerName?: string): Promise<string> {
    const michaelPhone = process.env.MICHAEL_PHONE!;
    
    console.log(`💼 MICHAEL ROUTING ATTEMPT:`);
    console.log(`- CallSid: ${callSid}`);
    console.log(`- Michael: ${michaelPhone}`);
    console.log(`- Caller: ${callerNumber}`);
    
    if (!michaelPhone) {
      console.error('❌ MICHAEL_PHONE not configured');
      await DatabaseService.updateCall(callSid, { outcome: 'michael_unavailable' });
      return TwilioService.takeMessage();
    }
    
    // Prevent self-routing
    if (michaelPhone === callerNumber) {
      console.error('❌ Cannot route Michael to himself');
      await DatabaseService.updateCall(callSid, { outcome: 'self_routing_blocked' });
      return TwilioService.takeMessage();
    }
    
    await DatabaseService.updateCall(callSid, { 
      outcome: 'attempting_michael_routing',
      status: 'routing'
    });
    
    return TwilioService.routeCallWithFallback(michaelPhone, callerNumber, '/api/michael-routing-status');
  }
  
  private static async fallbackToMichael(
    callSid: string, 
    callerNumber: string, 
    callerName: string | undefined, 
    reason: string
  ): Promise<string> {
    console.log(`⤴️ EMMA FAILED - FALLING BACK TO MICHAEL (${reason})`);
    
    const michaelPhone = process.env.MICHAEL_PHONE!;
    
    if (!michaelPhone || michaelPhone === callerNumber) {
      console.log('❌ Michael also unavailable or self-routing - taking message');
      await DatabaseService.updateCall(callSid, { outcome: 'all_routing_failed' });
      return TwilioService.takeMessage();
    }
    
    await DatabaseService.updateCall(callSid, { 
      outcome: 'emma_failed_routing_to_michael',
      status: 'routing'
    });
    
    return TwilioService.routeCallWithFallback(michaelPhone, callerNumber, '/api/michael-routing-status');
  }
  
  private static async handleSalesInquiry(callSid: string, callerNumber: string, callerName?: string): Promise<string> {
    console.log(`💰 SALES INQUIRY - Routing to Michael for now`);
    return await this.tryMichaelRouting(callSid, callerNumber, callerName);
  }
  
  static clearCallAttempts(callSid: string): void {
    const keys = Array.from(this.routingAttempts.keys()).filter(key => key.startsWith(callSid));
    keys.forEach(key => this.routingAttempts.delete(key));
  }
}
