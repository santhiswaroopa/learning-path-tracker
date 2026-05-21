'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) {
        setMobileOpen(false); // close sidebar when switching to mobile
      }
    };

    handleChange(mq); // initial check
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, mobileOpen]);

  const handleCloseMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm mobile-backdrop-anim"
          onClick={handleCloseMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={() => {
          if (isMobile) {
            setMobileOpen((o) => !o);
          } else {
            setCollapsed((c) => !c);
          }
        }}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={handleCloseMobileSidebar}
      />

      {/* Main area */}
      <div
        className="flex flex-col flex-1 overflow-hidden content-anim"
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)'),
        }}
      >
        <Navbar onMenuClick={() => setMobileOpen(true)} isMobile={isMobile} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
