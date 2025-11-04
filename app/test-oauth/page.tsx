'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';

export default function TestOAuthPage() {
  const { user, loginWithRoblox } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/roblox/debug')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching config:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Roblox OAuth2 Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold mb-4">Current Configuration</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>Client ID:</strong> {config?.clientId}</p>
            <p><strong>Redirect URI:</strong> {config?.redirectUri}</p>
            <p><strong>Has Client Secret:</strong> {config?.hasClientSecret ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Environment:</strong> {config?.environment}</p>
            <p><strong>Base URL:</strong> {config?.baseUrl}</p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">⚠️ Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to <a href="https://create.roblox.com/dashboard/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Roblox Creator Dashboard</a></li>
            <li>Find your OAuth 2.0 application (Client ID: {config?.clientId})</li>
            <li>Click on the application to edit it</li>
            <li>In the <strong>"Redirect URIs"</strong> section, add this exact URL:
              <div className="mt-2 p-3 bg-background rounded border border-border font-mono text-sm">
                {config?.redirectUri}
              </div>
            </li>
            <li>Click <strong>"Save"</strong></li>
            <li>Make sure the redirect URI matches EXACTLY (including http://localhost:3000)</li>
          </ol>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold mb-4">Test OAuth Flow</h2>
          <div className="space-y-4">
            {user ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="font-semibold text-green-800 dark:text-green-200">✅ You are logged in!</p>
                <p className="text-sm mt-2">Username: {user.username}</p>
                <p className="text-sm">ID: {user.id}</p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200">Not logged in</p>
              </div>
            )}
            
            <button
              onClick={loginWithRoblox}
              className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
            >
              🎮 Test Login with Roblox
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold mb-4">Common Issues & Solutions</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>❌ Error: "redirect_uri_mismatch"</strong>
              <p className="text-muted-foreground mt-1">
                Solution: Make sure the redirect URI in Roblox matches exactly: {config?.redirectUri}
              </p>
            </div>
            <div>
              <strong>❌ Error: "invalid_client"</strong>
              <p className="text-muted-foreground mt-1">
                Solution: Check that your Client ID and Client Secret are correct in the .env.local file
              </p>
            </div>
            <div>
              <strong>❌ Error: "client-side exception"</strong>
              <p className="text-muted-foreground mt-1">
                Solution: Check the browser console for detailed error messages. Make sure the redirect URI is configured in Roblox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

