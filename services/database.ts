import { neon } from '@neondatabase/serverless';
import { CallLog, TwilioPayload } from '../types/twilio';

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export class DatabaseService {
  static async logCall(data: Partial<CallLog>): Promise<void> {
    if (!sql) {
      console.log('Database not configured, skipping call log');
      return;
    }
    try {
      await sql`
        INSERT INTO calls (call_sid, from_number, to_number, caller_name, intent, transcript, outcome, duration, status, timestamp, recording_url)
        VALUES (${data.callSid}, ${data.from}, ${data.to}, ${data.callerName || null}, ${data.intent || null}, ${data.transcript || null}, ${data.outcome}, ${data.duration || null}, ${data.status}, ${data.timestamp}, ${data.recordingUrl || null})
      `;
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  static async updateCall(callSid: string, updates: Partial<CallLog>): Promise<void> {
    if (!sql) {
      console.log('Database not configured, skipping call update');
      return;
    }
    try {
      // For simplicity with Neon's tagged template literals, handle common update patterns
      const { intent, transcript, callerName, outcome, status, duration, recordingUrl } = updates;
      
      if (intent !== undefined || transcript !== undefined || callerName !== undefined) {
        await sql`
          UPDATE calls 
          SET intent = COALESCE(${intent || null}, intent),
              transcript = COALESCE(${transcript || null}, transcript),
              caller_name = COALESCE(${callerName || null}, caller_name)
          WHERE call_sid = ${callSid}
        `;
      }
      
      if (outcome !== undefined || status !== undefined || duration !== undefined || recordingUrl !== undefined) {
        await sql`
          UPDATE calls 
          SET outcome = COALESCE(${outcome || null}, outcome),
              status = COALESCE(${status || null}, status),
              duration = COALESCE(${duration || null}, duration),
              recording_url = COALESCE(${recordingUrl || null}, recording_url)
          WHERE call_sid = ${callSid}
        `;
      }
    } catch (error) {
      console.error('Database update error:', error);
    }
  }

  static async getCalls(limit = 20, offset = 0): Promise<CallLog[]> {
    if (!sql) {
      console.log('Database not configured, returning empty calls array');
      return [];
    }
    try {
      const calls = await sql`
        SELECT * FROM calls 
        ORDER BY timestamp DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      return calls as CallLog[];
    } catch (error) {
      console.error('Database query error:', error);
      return [];
    }
  }

  static async getTodayStats(): Promise<any> {
    if (!sql) {
      console.log('Database not configured, returning empty stats');
      return {};
    }
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await sql`
        SELECT 
          COUNT(*)::int as total_calls,
          COUNT(CASE WHEN outcome = 'connected' THEN 1 END)::int as successful_routes,
          COUNT(CASE WHEN outcome = 'filtered' THEN 1 END)::int as filtered_calls,
          COUNT(CASE WHEN outcome = 'message_taken' THEN 1 END)::int as messages_taken
        FROM calls 
        WHERE timestamp >= ${today}
      `;
      
      return stats[0] || {};
    } catch (error) {
      console.error('Database stats error:', error);
      return {};
    }
  }

  static async getMessages(limit = 20, offset = 0): Promise<CallLog[]> {
    if (!sql) {
      console.log('Database not configured, returning empty messages array');
      return [];
    }
    try {
      // Get calls that have recordings or were messages/voicemails
      const messages = await sql`
        SELECT * FROM calls 
        WHERE recording_url IS NOT NULL 
           OR outcome IN ('message_taken', 'michael_failed_taking_message', 'all_routing_failed')
        ORDER BY timestamp DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      return messages as CallLog[];
    } catch (error) {
      console.error('Database messages query error:', error);
      return [];
    }
  }

  static async executeQuery(query: string, values?: any[]): Promise<any> {
    if (!sql) {
      console.log('Database not configured, skipping query execution');
      return { rows: [] };
    }
    try {
      // Simple session query implementation for admin_sessions
      if (query.includes('admin_sessions')) {
        if (query.includes('SELECT')) {
          const sessionId = values?.[0];
          const result = await sql`
            SELECT * FROM admin_sessions 
            WHERE session_id = ${sessionId} AND expires_at > NOW()
          `;
          return { rows: result };
        } else if (query.includes('INSERT')) {
          const [sessionId, userId, expiresAt] = values || [];
          await sql`
            INSERT INTO admin_sessions (session_id, user_id, expires_at) 
            VALUES (${sessionId}, ${userId}, ${expiresAt})
            ON CONFLICT (session_id) DO UPDATE SET expires_at = ${expiresAt}
          `;
          return { rows: [] };
        } else if (query.includes('DELETE')) {
          const sessionId = values?.[0];
          await sql`DELETE FROM admin_sessions WHERE session_id = ${sessionId}`;
          return { rows: [] };
        }
      }
      return { rows: [] };
    } catch (error) {
      console.error('Database query execution error:', error);
      return { rows: [] };
    }
  }

  static async initializeDatabase(): Promise<void> {
    if (!sql) {
      console.log('Database not configured, skipping initialization');
      return;
    }
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS calls (
          id SERIAL PRIMARY KEY,
          call_sid VARCHAR(255) UNIQUE NOT NULL,
          from_number VARCHAR(20) NOT NULL,
          to_number VARCHAR(20) NOT NULL,
          caller_name VARCHAR(100),
          intent VARCHAR(50),
          transcript TEXT,
          outcome VARCHAR(50) NOT NULL,
          duration INTEGER,
          status VARCHAR(20) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          recording_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) UNIQUE NOT NULL,
          user_id VARCHAR(50) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }
}