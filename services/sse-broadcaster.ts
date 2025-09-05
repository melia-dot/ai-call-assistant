// SSE Broadcasting Service
// Manages real-time connections for dashboard updates

export class SSEBroadcaster {
  private static connections = new Set<ReadableStreamDefaultController>();
  
  static addConnection(controller: ReadableStreamDefaultController) {
    this.connections.add(controller);
  }
  
  static removeConnection(controller: ReadableStreamDefaultController) {
    this.connections.delete(controller);
  }
  
  static broadcast(data: any) {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    this.connections.forEach((controller) => {
      try {
        controller.enqueue(encoder.encode(message));
      } catch (error) {
        console.error('Failed to send SSE message:', error);
        this.connections.delete(controller);
      }
    });
  }
  
  static getConnectionCount(): number {
    return this.connections.size;
  }
}
