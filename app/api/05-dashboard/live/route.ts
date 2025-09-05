import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Store SSE connections
let connections = new Set<ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      connections.add(controller);
      
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Dashboard connected'
      })}\n\n`;
      
      controller.enqueue(encoder.encode(data));
      
      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          const statusUpdate = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(encoder.encode(statusUpdate));
        } catch (error) {
          clearInterval(heartbeat);
          connections.delete(controller);
        }
      }, 30000);
      
      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        connections.delete(controller);
      });
    },
    cancel() {
      connections.delete(this);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    },
  });
}

// Export function to broadcast to all connections
export function broadcastToClients(data: any) {
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  connections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(message));
    } catch (error) {
      console.error('Failed to send SSE message:', error);
      connections.delete(controller);
    }
  });
}