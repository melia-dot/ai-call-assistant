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

  // Fetch initial data
  useEffect(() => {
    fetchStats();
    fetchCallLog();
    
    // Set up real-time updates
    const eventSource = new EventSource('/api/05-dashboard/live');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'call_status') {
        setSystemStatus(data.status);
        setStatusMessage(data.message);
      } else if (data.type === 'new_call') {
        addCallToLog(data.call);
        fetchStats(); // Refresh stats
      }
    };

    return () => eventSource.close();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/05-dashboard/stats');
      const data = await response.json();
      if (data.success) {
        setStats({
          callsToday: data.data.today.total_calls || 0,
          successfulRoutes: data.data.today.successful_routes || 0,
          salesInquiries: data.data.today.sales_inquiries || 0,
          filteredCalls: data.data.today.filtered_calls || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCallLog = async () => {
    try {
      const response = await fetch('/api/05-dashboard/calls?limit=10');
      const data = await response.json();
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
      }
    } catch (error) {
      console.error('Failed to fetch call log:', error);
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