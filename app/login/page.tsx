'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { LogIn, User, Lock, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithRoblox } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for OAuth error in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const oauthError = searchParams.get('error');
    const errorDetails = searchParams.get('details');
    if (oauthError) {
      let errorMsg = `OAuth error: ${oauthError}`;
      if (errorDetails) {
        errorMsg += ` - ${errorDetails}`;
      }
      setError(errorMsg);
      // Clean URL
      router.replace('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      
      if (success) {
        router.push('/');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Login to your account</p>
          </div>

          {/* Roblox OAuth Login */}
          <div className="mb-6">
            <button
              type="button"
              onClick={loginWithRoblox}
              className={cn(
                "w-full px-6 py-3 rounded-xl font-semibold text-white",
                "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600",
                "transition-all flex items-center justify-center gap-2 shadow-lg"
              )}
            >
              <Gamepad2 className="h-5 w-5" />
              Login with Roblox
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className={cn(
                    "w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                    "transition-all"
                  )}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={cn(
                    "w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                    "transition-all"
                  )}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full px-6 py-3 rounded-xl font-semibold text-white",
                "bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all flex items-center justify-center gap-2"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-semibold">
                Register
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Demo accounts (any password works):
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• BuilderMax</p>
              <p>• NoobMaster99</p>
              <p>• PixelCrafter</p>
              <p>• AgentFox</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

