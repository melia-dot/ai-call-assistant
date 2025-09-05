import { NextRequest } from 'next/server';
import { SSEBroadcaster } from '../../../../services/sse-broadcaster';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      SSEBroadcaster.addConnection(controller);
      
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
          SSEBroadcaster.removeConnection(controller);
        }
      }, 30000);
      
      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        SSEBroadcaster.removeConnection(controller);
      });
    },
    cancel() {
      SSEBroadcaster.removeConnection(this);
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
