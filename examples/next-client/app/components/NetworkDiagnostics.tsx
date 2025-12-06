'use client';

import { useState } from 'react';

/**
 * Network diagnostics component
 */
export function NetworkDiagnostics() {
  const [status, setStatus] = useState<{ [key: string]: 'testing' | 'success' | 'error' }>({});
  const [results, setResults] = useState<{ [key: string]: string }>({});

  const testEndpoint = async (name: string, url: string) => {
    setStatus((prev) => ({ ...prev, [name]: 'testing' }));
    setResults((prev) => ({ ...prev, [name]: 'Testing...' }));

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (response.ok) {
        setStatus((prev) => ({ ...prev, [name]: 'success' }));
        setResults((prev) => ({
          ...prev,
          [name]: `✓ ${response.status} - ${JSON.stringify(data).substring(0, 100)}`,
        }));
      } else {
        setStatus((prev) => ({ ...prev, [name]: 'error' }));
        setResults((prev) => ({
          ...prev,
          [name]: `✗ ${response.status} - ${response.statusText}`,
        }));
      }
    } catch (error) {
      setStatus((prev) => ({ ...prev, [name]: 'error' }));
      setResults((prev) => ({
        ...prev,
        [name]: `✗ Network Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      }));
    }
  };

  const testAll = () => {
    testEndpoint('user.list', 'http://localhost:3000/api/user.list');
    testEndpoint('user.create', 'http://localhost:3000/api/user.create');
    testEndpoint('auth.session', 'http://localhost:3000/api/auth.session');
    testEndpoint('auth.login', 'http://localhost:3000/api/auth.login');
  };

  return (
    <div className="border border-yellow-700 rounded-lg p-6 bg-yellow-900/20">
      <h2 className="text-xl font-bold mb-4 text-yellow-400">🔍 Network Diagnostics</h2>

      <button
        onClick={testAll}
        className="mb-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
      >
        Test All Endpoints
      </button>

      <div className="space-y-2">
        {Object.entries(results).map(([name, result]) => (
          <div
            key={name}
            className={`p-3 rounded font-mono text-sm ${
              status[name] === 'success'
                ? 'bg-green-900/30 text-green-300'
                : status[name] === 'error'
                  ? 'bg-red-900/30 text-red-300'
                  : 'bg-gray-800 text-gray-400'
            }`}
          >
            <div className="font-semibold">{name}</div>
            <div className="text-xs mt-1">{result}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
        <div className="font-semibold mb-1">Common Issues:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Server not running: <code>npm run dev</code>
          </li>
          <li>Wrong port: Check if server is on port 3000</li>
          <li>CORS issues: Check browser console</li>
          <li>Route not found: Verify API route files exist</li>
        </ul>
      </div>
    </div>
  );
}
