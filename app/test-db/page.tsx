'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestDBPage() {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();

        // Test 1: Check if client is created
        setStatus('✓ Supabase client created');

        // Test 2: Try to query organizations table
        const { data, error: queryError } = await supabase
          .from('organizations')
          .select('*')
          .limit(1);

        if (queryError) {
          setError(`Query error: ${queryError.message}`);
          setStatus('✗ Connection failed');
          return;
        }

        setStatus('✓ Database connection successful!');

        // Test 3: List all tables (by trying to query each)
        const tableNames = [
          'organizations',
          'profiles',
          'permissions',
          'personnel',
          'notes',
          'tasks',
          'ai_analyses',
        ];

        const existingTables: string[] = [];

        for (const tableName of tableNames) {
          const { error: tableError } = await supabase
            .from(tableName)
            .select('id')
            .limit(1);

          if (!tableError) {
            existingTables.push(tableName);
          }
        }

        setTables(existingTables);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('✗ Connection failed');
      }
    }

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-center">
          Supabase Database Test
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
            <p className="text-lg">{status}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="text-red-800 font-semibold">Error:</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {tables.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Tables Found ({tables.length}/7)
              </h2>
              <ul className="space-y-1">
                {tables.map((table) => (
                  <li key={table} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="font-mono">{table}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Environment Variables:</h3>
            <div className="font-mono text-sm space-y-1">
              <p>
                <span className="text-gray-600">SUPABASE_URL:</span>{' '}
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
              </p>
              <p>
                <span className="text-gray-600">SUPABASE_ANON_KEY:</span>{' '}
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                  ? '✓ Set'
                  : '✗ Missing'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
