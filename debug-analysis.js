// Test script to analyze Emma routing issue
// Based on the logs, this simulates the exact call flow

const EMMA_PHONE = '+447782302065';
const CALLER_PHONE = '+447311197634';
const SYSTEM_PHONE = '+447427134999';

console.log('🔍 EMMA ROUTING ANALYSIS');
console.log('========================');

console.log('\n1. ENVIRONMENT VERIFICATION:');
console.log('- Emma phone:', EMMA_PHONE);
console.log('- Michael phone:', '+447311197634');
console.log('- System phone:', SYSTEM_PHONE);

console.log('\n2. ROUTING LOGIC CHECK:');
console.log('- Caller number:', CALLER_PHONE);
console.log('- Target number:', EMMA_PHONE);
console.log('- Same number check:', EMMA_PHONE === CALLER_PHONE, '← Should be false');

console.log('\n3. SUSPECTED ISSUES:');
console.log('❌ Trial Account Restriction: Emma may not be verified in Twilio');
console.log('❌ UK Carrier Blocking: +447782 prefix might reject forwarded calls');
console.log('❌ Missing Dial Parameters: Twilio dial might need additional config');

console.log('\n4. DIAL CONFIGURATION ANALYSIS:');
const dialConfig = {
  timeout: 30,
  action: '/api/debug-webhook',
  record: 'record-from-ringing'
};
console.log('Current dial config:', dialConfig);

console.log('\n5. TROUBLESHOOTING STEPS:');
console.log('1. Check Twilio trial account verified numbers');
console.log('2. Verify Emma number can receive calls from system');
console.log('3. Test direct dial without TwiML first');
console.log('4. Check webhook payload for DialCallStatus details');

console.log('\n🎯 RECOMMENDATION:');
console.log('Deploy debug webhook and test with verified caller to capture exact failure reason.');