import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// In a real implementation, you'd want to use a more robust solution for production
// This is a simplified version for demo purposes
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Dashboard connected'
      })}\n\n`;
      
      controller.enqueue(encoder.encode(data));
      
      // For demo purposes, send periodic status updates
      const interval = setInterval(() => {
        try {
          const statusUpdate = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(encoder.encode(statusUpdate));
        } catch (error) {
          clearInterval(interval);
        }
      }, 30000); // Every 30 seconds
      
      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}