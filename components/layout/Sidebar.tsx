'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  FileTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboardIcon },
  { label: 'Topics',    href: '/topics',    Icon: BookOpenIcon },
  { label: 'Notes',     href: '/notes',     Icon: FileTextIcon },
];

const LogOutIcon = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Sidebar({
  collapsed,
  onToggle,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState('Learner');

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.username) {
            setUsername(data.username);
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.replace('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const initialLetter = username.charAt(0).toUpperCase() || 'L';

  // Mobile layout styles override desktop styles
  const sidebarWidth = isMobile
    ? 'var(--sidebar-w)'
    : (collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)');

  const transformStyle = isMobile
    ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)')
    : 'none';

  return (
    <aside
      className="sidebar-anim fixed left-0 top-0 h-screen flex flex-col transition-all duration-300"
      style={{
        width: sidebarWidth,
        transform: transformStyle,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        zIndex: isMobile ? 50 : 40,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center h-[60px] px-4 shrink-0 justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center">
          {/* Icon mark — always visible */}
          <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center glow-purple"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.9" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Brand name — hidden when collapsed */}
          <div
            className="overflow-hidden"
            style={{
              width: (collapsed && !isMobile) ? 0 : 120,
              opacity: (collapsed && !isMobile) ? 0 : 1,
              transition: 'width 0.25s ease, opacity 0.2s ease',
              marginLeft: (collapsed && !isMobile) ? 0 : 10,
            }}
          >
            <span className="font-semibold text-sm tracking-tight whitespace-nowrap gradient-text block">
              LearnPath
            </span>
            <p className="text-[10px] text-slate-500 whitespace-nowrap">Learning Tracker</p>
          </div>
        </div>

        {/* Mobile close button inside sidebar */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all cursor-pointer"
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(({ label, href, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const isItemCollapsed = collapsed && !isMobile;
          return (
            <Link
              key={href}
              href={href}
              title={isItemCollapsed ? label : undefined}
              onClick={isMobile ? onMobileClose : undefined}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                'transition-all duration-150 group relative',
                active
                  ? 'nav-active'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <span className="shrink-0">
                <Icon size={17} className={active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
              </span>

              <span
                className="whitespace-nowrap overflow-hidden"
                style={{
                  width: isItemCollapsed ? 0 : 'auto',
                  opacity: isItemCollapsed ? 0 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {label}
              </span>

              {/* Tooltip when collapsed */}
              {isItemCollapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium
                  bg-slate-800 text-slate-200 border border-white/10 whitespace-nowrap
                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider + toggle */}
      <div className="shrink-0 p-2 space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
        {/* User avatar row */}
        {!(collapsed && !isMobile) ? (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'var(--card)' }}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                {initialLetter}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-200 truncate">{username}</p>
                <p className="text-[10px] text-slate-500 truncate">learner</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOutIcon size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOutIcon size={14} />
          </button>
        )}

        {/* Collapse toggle (only desktop) */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all text-xs font-medium cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRightIcon size={16} />
              : (
                <>
                  <ChevronLeftIcon size={16} />
                  <span className="whitespace-nowrap">Collapse</span>
                </>
              )
            }
          </button>
        )}
      </div>
    </aside>
  );
}
