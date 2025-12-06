'use client';

import { useState } from 'react';

/**
 * Demo component for cookie utilities
 */
export function CookieDemo() {
  const [status, setStatus] = useState<string>('');
  const [cookies, setCookies] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSetCookies = async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/auth/cookie-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set' }),
      });
      const data = await res.json();
      setStatus(`✓ ${data.message}`);
      // Refresh cookie view
      await handleViewCookies();
    } catch (error) {
      setStatus(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCookies = async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/auth/cookie-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      const data = await res.json();
      setStatus(`✓ ${data.message}`);
      // Refresh cookie view
      await handleViewCookies();
    } catch (error) {
      setStatus(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCookies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/cookie-demo');
      const data = await res.json();
      setCookies(data);
    } catch (error) {
      setStatus(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
      <h2 className="text-xl font-bold mb-4">Cookie Utilities Demo</h2>

      <div className="space-y-3 mb-4">
        <button
          onClick={handleSetCookies}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Set Demo Cookies
        </button>
        <button
          onClick={handleClearCookies}
          disabled={loading}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Clear Auth Cookies
        </button>
        <button
          onClick={handleViewCookies}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          View Current Cookies
        </button>
      </div>

      {status && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            status.startsWith('✓') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}
        >
          {status}
        </div>
      )}

      {cookies && (
        <div className="p-3 bg-gray-800 rounded">
          <div className="text-sm font-semibold mb-2">Current Cookies:</div>
          <pre className="text-xs overflow-x-auto">{JSON.stringify(cookies, null, 2)}</pre>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
        <div className="font-semibold mb-1">Available utilities:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <code>getSessionCookies()</code> - Get all auth cookies
          </li>
          <li>
            <code>setSessionCookies()</code> - Set auth cookies
          </li>
          <li>
            <code>clearAuthCookies()</code> - Clear all auth cookies
          </li>
          <li>
            <code>getAccessToken()</code> - Get access token
          </li>
          <li>
            <code>setAccessToken()</code> - Set access token
          </li>
          <li>
            <code>getRefreshToken()</code> - Get refresh token
          </li>
          <li>
            <code>setRefreshToken()</code> - Set refresh token
          </li>
        </ul>
      </div>
    </div>
  );
}
