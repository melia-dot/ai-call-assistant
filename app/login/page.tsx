'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/04-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=\"min-h-screen\" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      <div className=\"flex items-center justify-center min-h-screen px-4\">
        <div className=\"bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl w-full max-w-md\">
          <div className=\"text-center mb-8\">
            <h1 className=\"text-3xl font-light text-gray-800 mb-2\">AI Call Assistant</h1>
            <p className=\"text-gray-600\">NuVance Labs - Admin Login</p>
          </div>

          <form onSubmit={handleSubmit} className=\"space-y-6\">
            <div>
              <label htmlFor=\"username\" className=\"block text-sm font-medium text-gray-700 mb-2\">
                Username
              </label>
              <input
                type=\"text\"
                id=\"username\"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className=\"w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all\"
                placeholder=\"admin\"
                required
              />
            </div>

            <div>
              <label htmlFor=\"password\" className=\"block text-sm font-medium text-gray-700 mb-2\">
                Password
              </label>
              <input
                type=\"password\"
                id=\"password\"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=\"w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all\"
                placeholder=\"Enter password\"
                required
              />
            </div>

            {error && (
              <div className=\"bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl\">
                {error}
              </div>
            )}

            <button
              type=\"submit\"
              disabled={loading}
              className=\"w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed\"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className=\"mt-6 text-center text-sm text-gray-600\">
            <p>System Access: Admin Only</p>
            <p className=\"mt-2 text-xs text-gray-500\">
              Phone: +44 7427 134999 | Dashboard Access Required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
