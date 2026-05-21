'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  CheckCircleIcon,
  FlameIcon,
  LayersIcon,
  FileTextIcon,
  TrendingUpIcon,
  ZapIcon,
  ClockIcon,
} from '@/components/icons';
import QuickRevisionSection from '@/components/ui/QuickRevisionSection';
import type { Topic, Note } from '@/types';

interface DashboardData {
  username: string;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  totalNotes: number;
  currentStreak: number;
  weeklyGoal: number;
  weeklyCompleted: number;
  totalSubtopics: number;
  completedSubtopics: number;
  overallProgress: number;
  streakDays: boolean[];
  recentActivity: Array<{
    id: string;
    type: 'note_added' | 'subtopic_done' | 'topic_completed';
    message: string;
    timestamp: string;
    topicTitle: string;
  }>;
}

function ActivityIcon({ type }: { type: string }) {
  const base = 'w-7 h-7 rounded-lg flex items-center justify-center shrink-0';
  if (type === 'note_added')
    return <div className={base} style={{ background: 'rgba(139,92,246,0.15)' }}><FileTextIcon size={13} className="text-violet-400" /></div>;
  if (type === 'topic_completed')
    return <div className={base} style={{ background: 'rgba(52,211,153,0.15)' }}><CheckCircleIcon size={13} className="text-emerald-400" /></div>;
  if (type === 'subtopic_done')
    return <div className={base} style={{ background: 'rgba(59,130,246,0.15)' }}><ZapIcon size={13} className="text-blue-400" /></div>;
  return <div className={base} style={{ background: 'rgba(255,255,255,0.06)' }}><ClockIcon size={13} className="text-slate-400" /></div>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const DAYS_LABEL = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [dashboardRes, topicsRes, notesRes] = await Promise.all([
          fetch('/api/dashboard', { credentials: 'include' }),
          fetch('/api/topics', { credentials: 'include' }),
          fetch('/api/notes', { credentials: 'include' }),
        ]);

        if (!dashboardRes.ok || !topicsRes.ok || !notesRes.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const dashboardData = await dashboardRes.json();
        const topicsData = await topicsRes.json();
        const notesData = await notesRes.json();

        setData(dashboardData);
        setTopics(topicsData);
        setNotes(notesData);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const handleToggleNoteImportance = async (noteId: number, currentVal: boolean) => {
    // Optimistic Update
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isImportant: !currentVal } : n));

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isImportant: !currentVal }),
      });
      if (!res.ok) throw new Error('Failed to toggle note importance');
    } catch (err) {
      console.error(err);
      // Revert
      setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isImportant: currentVal } : n));
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-[1400px] animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-32 rounded-2xl bg-white/[0.03] border border-white/[0.05]" />
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
          ))}
        </div>

        {/* Middle row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
          <div className="h-64 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
        </div>

        {/* Quick Revision Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-36 bg-white/[0.03] rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-red-500/10 border border-red-500/20">
          <span className="text-red-400 text-lg font-bold">!</span>
        </div>
        <h3 className="text-sm font-semibold text-slate-100">Failed to Load Dashboard</h3>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const {
    username,
    totalTopics,
    completedTopics,
    inProgressTopics,
    totalNotes,
    currentStreak,
    weeklyGoal,
    weeklyCompleted,
    totalSubtopics,
    completedSubtopics,
    overallProgress,
    streakDays,
    recentActivity,
  } = data;

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* ── Welcome banner ─────────────────────────────── */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.10) 50%, rgba(59,130,246,0.08) 100%)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-violet-400 mb-1 tracking-wide uppercase">Good evening</p>
            <h2 className="text-xl font-bold text-slate-100">Welcome back, {username} 👋</h2>
            <p className="text-sm text-slate-400 mt-1">
              You&apos;re on a <span className="text-orange-400 font-semibold">{currentStreak}-day streak</span>. Keep the momentum going!
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text tabular-nums">{overallProgress}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Overall Progress</p>
            </div>
          </div>
        </div>

        <div className="relative mt-4">
          <ProgressBar value={overallProgress} height={6} />
        </div>
      </div>

      {totalTopics === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <LayersIcon size={28} className="text-violet-400" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Your Learning Path is Empty</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-md">
            Start your learning journey by creating your first topic. Track your progress, take notes, and build a consistent streak!
          </p>
          <a
            href="/topics"
            className="mt-6 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            Create Your First Topic
          </a>
        </div>
      ) : (
        <>
          {/* ── Stat cards ─────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in-up">
            <StatCard
              label="Topics"
              value={totalTopics}
              sub={`${inProgressTopics} in progress`}
              icon={<LayersIcon size={16} className="text-white" />}
              iconBg="linear-gradient(135deg, #8b5cf6, #6366f1)"
              className="fade-in-up fade-in-up-1"
            />
            <StatCard
              label="Completed"
              value={completedTopics}
              sub={totalTopics > 0 ? `${Math.round((completedTopics / totalTopics) * 100)}% completion` : '0% completion'}
              icon={<CheckCircleIcon size={16} className="text-white" />}
              iconBg="linear-gradient(135deg, #10b981, #059669)"
              className="fade-in-up fade-in-up-2"
            />
            <StatCard
              label="Notes"
              value={totalNotes}
              sub="Across all topics"
              icon={<FileTextIcon size={16} className="text-white" />}
              iconBg="linear-gradient(135deg, #3b82f6, #2563eb)"
              className="fade-in-up fade-in-up-3"
            />
            <StatCard
              label="Streak"
              value={`${currentStreak} days`}
              sub="Keep the flame alive!"
              icon={<FlameIcon size={16} className="text-white" />}
              iconBg="linear-gradient(135deg, #f97316, #ef4444)"
              className="fade-in-up fade-in-up-4"
            />
          </div>

          {/* ── Middle row ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Topic progress */}
            <div className="lg:col-span-2 rounded-xl p-6 space-y-5"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Topic Progress</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{completedSubtopics}/{totalSubtopics} subtopics completed</p>
                </div>
                <TrendingUpIcon size={16} className="text-violet-400" />
              </div>

              <div className="space-y-4">
                {topics.slice(0, 4).map((t) => (
                  <div key={t.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400 truncate max-w-[200px]">{t.title}</span>
                      <span className="text-xs font-semibold text-slate-300 tabular-nums shrink-0 ml-2">{t.progress}%</span>
                    </div>
                    <ProgressBar value={t.progress} height={5} />
                  </div>
                ))}
                {topics.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No topics currently in progress.</p>
                )}
              </div>
            </div>

            {/* Streak + weekly goal */}
            <div className="rounded-xl p-6 flex flex-col gap-5"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {/* Streak */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="streak-badge w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                    <FlameIcon size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{currentStreak}-Day Streak</p>
                    <p className="text-xs text-slate-500">Keep it up!</p>
                  </div>
                </div>

                {/* Day circles */}
                <div className="grid grid-cols-7 gap-1.5">
                  {streakDays.map((active, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all"
                        style={{
                          background: active
                            ? 'linear-gradient(135deg, #f97316, #ef4444)'
                            : 'rgba(255,255,255,0.04)',
                          border: active ? 'none' : '1px solid var(--border)',
                          color: active ? 'white' : '#64748b',
                        }}
                      >
                        {active ? '🔥' : ''}
                      </div>
                      <span className="text-[9px] text-slate-600">{DAYS_LABEL[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly goal */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400">Weekly Goal</p>
                  <span className="text-xs font-semibold text-slate-300 tabular-nums">
                    {weeklyCompleted}/{weeklyGoal} days
                  </span>
                </div>
                <ProgressBar value={weeklyGoal > 0 ? (weeklyCompleted / weeklyGoal) * 100 : 0} height={6} />
                <p className="text-[11px] text-slate-600 mt-2">
                  {weeklyCompleted >= weeklyGoal 
                    ? 'Goal achieved! Awesome work!' 
                    : `${weeklyGoal - weeklyCompleted} day${weeklyGoal - weeklyCompleted !== 1 ? 's' : ''} left to hit your goal`}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Revision Section */}
          <QuickRevisionSection notes={notes} onToggleImportant={handleToggleNoteImportance} />

          {/* ── Recent activity ────────────────────────────── */}
          <div className="rounded-xl p-6"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-100">Recent Activity</h3>
            </div>

            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-white/[0.02]"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300">{item.message}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{item.topicTitle}</p>
                  </div>
                  <span className="text-[11px] text-slate-600 shrink-0">{timeAgo(item.timestamp)}</span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No recent activity logged.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
