'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BellIcon } from '@/components/icons';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your learning overview' },
  '/topics': { title: 'Topics', subtitle: 'Manage your learning topics' },
  '/notes': { title: 'Notes', subtitle: 'Your knowledge base' },
};

export default function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState('');

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.username) setUsername(data.username);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    }
    fetchUser();
  }, []);

  const match = Object.entries(pageTitles).find(([key]) => pathname === key || pathname.startsWith(key + '/'));
  const { title, subtitle } = match?.[1] ?? { title: 'LearnPath', subtitle: '' };

  const initial = username ? username.charAt(0).toUpperCase() : '?';

  return (
    <header
      className="shrink-0 flex items-center justify-between px-6 lg:px-8"
      style={{
        height: 'var(--navbar-h)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left — page title */}
      <div>
        <h1 className="text-sm font-semibold text-slate-100 leading-tight">{title}</h1>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
          title="Notifications"
        >
          <BellIcon size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500">
            <span className="absolute inset-0 rounded-full bg-violet-400 dot-ping" />
          </span>
        </button>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer
            hover:ring-2 hover:ring-violet-500/40 transition-all"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
          title={username || 'Profile'}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
