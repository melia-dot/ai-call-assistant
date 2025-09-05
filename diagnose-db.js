// Database diagnostic script
import { DatabaseService } from './services/database.js';

async function diagnoseCalls() {
  console.log('🔍 CALL DATABASE DIAGNOSTICS');
  console.log('============================');
  
  try {
    // Check database connection
    console.log('Testing database connection...');
    
    // Get recent calls
    const calls = await DatabaseService.getRecentCalls();
    console.log(`📞 Found ${calls.length} calls in database`);
    
    // Show call details
    calls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.from} → ${call.intent || 'unknown'} (${call.outcome})`);
    });
    
    // Get stats
    const stats = await DatabaseService.getCallStats();
    console.log('\n📊 CURRENT STATS:');
    console.log('- Total calls:', stats.totalCalls);
    console.log('- Successful routes:', stats.successfulRoutes);
    console.log('- Sales inquiries:', stats.salesInquiries);
    console.log('- Filtered calls:', stats.filteredCalls);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

diagnoseCalls();
