'use client';

import { useState, useEffect } from 'react';

interface CallActivity {
  time: string;
  timeAgo: string;
  from: string;
  outcome: string;
  intent: string;
  success: boolean;
}

interface SystemStats {
  callsToday: number;
  successfulRoutes: number;
  salesInquiries: number;
  filteredCalls: number;
}

interface VoicemailMessage {
  id: number;
  callSid: string;
  from: string;
  callerName: string;
  timestamp: string;
  timeAgo: string;
  recordingUrl?: string;
  transcript?: string;
  intent?: string;
  outcome: string;
  duration?: number;
}

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState('Ready');
  const [statusMessage, setStatusMessage] = useState('Waiting for incoming calls...');
  const [stats, setStats] = useState<SystemStats>({
    callsToday: 0,
    successfulRoutes: 0,
    salesInquiries: 0,
    filteredCalls: 0
  });
  const [callLog, setCallLog] = useState<CallActivity[]>([]);
  const [messages, setMessages] = useState<VoicemailMessage[]>([]);

  // Fetch initial data
  useEffect(() => {
    console.log('Dashboard: Starting initialization...');
    
    fetchStats();
    fetchCallLog();
    fetchMessages();
    
    // Set up real-time updates
    console.log('Dashboard: Setting up SSE connection...');
    const eventSource = new EventSource('/api/05-dashboard/live');
    
    eventSource.onopen = () => {
      console.log('Dashboard: SSE connection opened');
    };
    
    eventSource.onmessage = (event) => {
      console.log('Dashboard: SSE message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'call_status') {
          setSystemStatus(data.status);
          setStatusMessage(data.message);
        } else if (data.type === 'new_call') {
          addCallToLog(data.call);
          fetchStats(); // Refresh stats
          fetchMessages(); // Refresh messages in case it was a voicemail
        } else if (data.type === 'call_completed') {
          console.log('Dashboard: Call completed, refreshing data...');
          fetchStats(); // Refresh stats
          fetchCallLog(); // Refresh call log
          fetchMessages(); // Refresh messages
        }
      } catch (error) {
        console.error('Dashboard: Error parsing SSE data:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('Dashboard: SSE error:', error);
    };

    return () => {
      console.log('Dashboard: Closing SSE connection');
      eventSource.close();
    };
  }, []);

  const fetchStats = async () => {
    console.log('Dashboard: Fetching stats...');
    try {
      const response = await fetch('/api/05-dashboard/stats');
      console.log('Dashboard: Stats response status:', response.status);
      
      const data = await response.json();
      console.log('Dashboard: Stats data:', data);
      
      if (data.success) {
        setStats({
          callsToday: data.data.today.total_calls || 0,
          successfulRoutes: data.data.today.successful_routes || 0,
          salesInquiries: data.data.today.sales_inquiries || 0,
          filteredCalls: data.data.today.filtered_calls || 0
        });
      } else {
        console.error('Dashboard: Stats API returned error:', data.message);
      }
    } catch (error) {
      console.error('Dashboard: Failed to fetch stats:', error);
    }
  };

  const fetchCallLog = async () => {
    console.log('Dashboard: Fetching call log...');
    try {
      const response = await fetch('/api/05-dashboard/calls?limit=10');
      console.log('Dashboard: Call log response status:', response.status);
      
      const data = await response.json();
      console.log('Dashboard: Call log data:', data);
      
      if (data.success) {
        const formattedCalls = data.data.map((call: any) => ({
          time: new Date(call.timestamp).toLocaleTimeString(),
          timeAgo: getTimeAgo(new Date(call.timestamp)),
          from: call.from_number,
          outcome: call.outcome,
          intent: call.intent || 'unknown',
          success: call.outcome === 'connected' || call.outcome === 'completed'
        }));
        setCallLog(formattedCalls);
      } else {
        console.error('Dashboard: Call log API returned error:', data.message);
      }
    } catch (error) {
      console.error('Dashboard: Failed to fetch call log:', error);
    }
  };

  const fetchMessages = async () => {
    console.log('Dashboard: Fetching messages/voicemails...');
    try {
      const response = await fetch('/api/05-dashboard/messages?limit=10');
      console.log('Dashboard: Messages response status:', response.status);
      
      const data = await response.json();
      console.log('Dashboard: Messages data:', data);
      
      if (data.success) {
        setMessages(data.data);
      } else {
        console.error('Dashboard: Messages API returned error:', data.message);
      }
    } catch (error) {
      console.error('Dashboard: Failed to fetch messages:', error);
    }
  };

  const addCallToLog = (call: CallActivity) => {
    setCallLog(prev => [call, ...prev.slice(0, 9)]); // Keep only 10 most recent
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white mb-2">AI Call Assistant</h1>
          <p className="text-xl text-white/80">NuVance Labs - Real-time Call Monitoring</p>
        </div>

        {/* Live Activity Banner */}
        <div className="mb-8 p-6 rounded-2xl text-center text-white" style={{
          background: 'linear-gradient(45deg, #ff6b6b, #feca57)'
        }}>
          <h2 className="text-2xl mb-2">System Status: {systemStatus}</h2>
          <div className="w-5 h-5 bg-white rounded-full mx-auto mb-2 animate-pulse"></div>
          <p>{statusMessage}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-2xl text-center">
            <div className="text-4xl font-bold mb-2">{stats.callsToday}</div>
            <div className="text-sm opacity-90">Calls Today</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-blue-600 text-white p-6 rounded-2xl text-center">
            <div className="text-4xl font-bold mb-2">{stats.successfulRoutes}</div>
            <div className="text-sm opacity-90">Successfully Routed</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white p-6 rounded-2xl text-center">
            <div className="text-4xl font-bold mb-2">{stats.salesInquiries}</div>
            <div className="text-sm opacity-90">Sales Inquiries</div>
          </div>
          <div className="bg-gradient-to-br from-gray-600 to-gray-800 text-white p-6 rounded-2xl text-center">
            <div className="text-4xl font-bold mb-2">{stats.filteredCalls}</div>
            <div className="text-sm opacity-90">Filtered Calls</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* System Health */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-6">System Health</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Operational</span>
              <span className="text-gray-600">All systems running smoothly</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Webhook Response Time</span>
                <span className="font-bold text-gray-800">&lt; 1s</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Claude API Status</span>
                <span className="font-bold text-green-600">✓ Active</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Database Connection</span>
                <span className="font-bold text-green-600">✓ Connected</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Last Call</span>
                <span className="font-bold text-gray-800">
                  {callLog[0] ? callLog[0].timeAgo : 'No calls yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Call Activity */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-6">Call Activity</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">System Ready for Calls</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Emma Routing</span>
                <span className="font-bold text-gray-800">
                  {callLog.filter(call => call.outcome.includes('Emma')).length} calls
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Michael Routing</span>
                <span className="font-bold text-gray-800">
                  {callLog.filter(call => call.outcome.includes('Michael')).length} calls
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Sales Bookings</span>
                <span className="font-bold text-gray-800">{stats.salesInquiries} scheduled</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Messages Taken</span>
                <span className="font-bold text-gray-800">
                  {callLog.filter(call => call.outcome.includes('message')).length} messages
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages/Voicemails Section */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">Voicemail Messages</h3>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No voicemail messages yet.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="p-4 rounded-xl border-l-4 border-l-blue-500 bg-blue-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {message.callerName} ({message.from})
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(message.timestamp).toLocaleString()} - {message.timeAgo}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="inline-block bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs">
                        {message.intent || 'Unknown'}
                      </span>
                      <span className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                        {message.outcome}
                      </span>
                    </div>
                  </div>
                  {message.transcript && (
                    <div className="text-gray-700 mb-2 italic">
                      "{message.transcript}"
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Duration: {message.duration ? `${message.duration}s` : 'Unknown'}
                    </div>
                    {message.recordingUrl && (
                      <audio controls className="h-8">
                        <source src={message.recordingUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Call Activity */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">Recent Call Activity</h3>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {callLog.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No calls logged yet. Waiting for incoming calls...
              </div>
            ) : (
              callLog.map((call, index) => (
                <div key={index} className={`p-4 rounded-xl border-l-4 ${
                  call.success ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                }`}>
                  <div className="text-sm text-gray-500 mb-1">{call.time} - {call.timeAgo}</div>
                  <div className="font-semibold text-gray-800 mb-1">{call.from} → {call.outcome}</div>
                  <span className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                    {call.intent}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}