require('dotenv').config();

// Database diagnostic script - CommonJS version
const { Pool } = require('pg');

async function diagnoseCalls() {
  console.log('🔍 CALL DATABASE DIAGNOSTICS');
  console.log('============================');
  
  try {
    // Create database connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('🔗 Testing database connection...');
    
    // Get recent calls
    const callsQuery = `
      SELECT * FROM calls 
      ORDER BY timestamp DESC 
      LIMIT 10
    `;
    
    const callsResult = await pool.query(callsQuery);
    const calls = callsResult.rows;
    
    console.log(`📞 Found ${calls.length} calls in database`);
    
    // Show call details
    calls.forEach((call, index) => {
      const timestamp = new Date(call.timestamp).toLocaleString();
      console.log(`${index + 1}. ${call.from} → ${call.intent || 'unknown'} (${call.outcome}) - ${timestamp}`);
    });
    
    // Get stats for today
    const statsQuery = `
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN outcome = 'completed' THEN 1 END) as successful_routes,
        COUNT(CASE WHEN intent = 'sales_general' THEN 1 END) as sales_inquiries,
        COUNT(CASE WHEN outcome = 'filtered' THEN 1 END) as filtered_calls,
        COUNT(CASE WHEN intent = 'emma_request' THEN 1 END) as emma_requests
      FROM calls 
      WHERE DATE(timestamp) = CURRENT_DATE
    `;
    
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('\n📊 TODAY\'S STATS:');
    console.log('- Total calls:', stats.total_calls);
    console.log('- Successful routes:', stats.successful_routes);
    console.log('- Sales inquiries:', stats.sales_inquiries);
    console.log('- Filtered calls:', stats.filtered_calls);
    console.log('- Emma requests:', stats.emma_requests);
    
    // Check for stuck calls
    const stuckQuery = `
      SELECT * FROM calls 
      WHERE outcome = 'processing'
      AND timestamp < NOW() - INTERVAL '5 minutes'
    `;
    
    const stuckResult = await pool.query(stuckQuery);
    
    if (stuckResult.rows.length > 0) {
      console.log('\n⚠️  STUCK CALLS DETECTED:');
      stuckResult.rows.forEach(call => {
        console.log(`- ${call.call_sid}: stuck in '${call.outcome}' since ${call.timestamp}`);
      });
    }
    
    await pool.end();
    console.log('\n✅ Database diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

diagnoseCalls();
