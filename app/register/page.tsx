"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Registration failed');
        return;
      }
      
      // On success, redirect to dashboard
      router.replace('/dashboard');
    } catch (err) {
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm rounded-xl p-8 shadow-2xl glass fade-in-up border border-white/[0.05]" style={{ background: 'var(--card)' }}>
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center glow-purple mb-3"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.9" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold gradient-text">Create Account</h1>
          <p className="text-xs text-slate-400 mt-1">Start tracking your learning journey</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-400 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter a username"
              className="block w-full rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              className="block w-full rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-400 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              className="block w-full rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all duration-150 active:scale-98 glow-purple disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
