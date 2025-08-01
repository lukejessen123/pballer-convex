import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function ConvexTest() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Test Convex connection by trying to fetch a simple query
  const testQuery = useQuery(api.myFunctions.listClubs);

  useEffect(() => {
    if (testQuery === undefined) {
      // Still loading
      setConnectionStatus('loading');
    } else if (testQuery === null) {
      // Error occurred
      setConnectionStatus('error');
      setErrorMessage('Failed to connect to Convex');
    } else {
      // Success - we got data (even if it's an empty array)
      setConnectionStatus('success');
    }
  }, [testQuery]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Convex Connection Test</h2>
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            connectionStatus === 'loading'
              ? 'bg-yellow-500 animate-pulse'
              : connectionStatus === 'success'
              ? 'bg-green-500'
              : 'bg-red-500'
          }`}
        />
        <span>
          {connectionStatus === 'loading'
            ? 'Testing connection...'
            : connectionStatus === 'success'
            ? 'Successfully connected to Convex!'
            : `Connection failed: ${errorMessage}`}
        </span>
      </div>
      {connectionStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800">
            Convex is working! Found {Array.isArray(testQuery) ? testQuery.length : 0} items in the test query.
          </p>
        </div>
      )}
    </div>
  );
} 