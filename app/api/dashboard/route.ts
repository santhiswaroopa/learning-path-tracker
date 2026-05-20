import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TopicStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // Core counts
    const totalTopics = await prisma.topic.count({ where: { userId } });
    const completedTopicsCount = await prisma.topic.count({
      where: { status: TopicStatus.COMPLETED, userId },
    });
    const inProgressTopicsCount = await prisma.topic.count({
      where: { status: TopicStatus.IN_PROGRESS, userId },
    });
    const totalNotes = await prisma.note.count({ where: { userId } });

    // Subtopic progress
    const completedSubtopics = await prisma.subtopic.count({
      where: { isCompleted: true, topic: { userId } },
    });
    const totalSubtopics = await prisma.subtopic.count({ where: { topic: { userId } } });
    const overallProgress = totalSubtopics > 0
      ? Math.round((completedSubtopics / totalSubtopics) * 100)
      : 0;

    // Activity dates for streak calculation
    const [topicsWithDates, subtopicsWithDates, notesWithDates] = await Promise.all([
      prisma.topic.findMany({ where: { userId }, select: { createdAt: true } }),
      prisma.subtopic.findMany({ where: { topic: { userId } }, select: { createdAt: true } }),
      prisma.note.findMany({ where: { userId }, select: { createdAt: true } }),
    ]);

    const allDates = [
      ...topicsWithDates.map(t => t.createdAt),
      ...subtopicsWithDates.map(s => s.createdAt),
      ...notesWithDates.map(n => n.createdAt),
    ];

    const uniqueDates = Array.from(
      new Set(
        allDates.map(date => {
          const d = new Date(date);
          return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        })
      )
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Streak calculation
    let streak = 0;
    if (uniqueDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const hasToday = uniqueDates.includes(todayStr);
      const hasYesterday = uniqueDates.includes(yesterdayStr);
      if (hasToday || hasYesterday) {
        let ref = hasToday ? new Date() : yesterday;
        while (uniqueDates.includes(ref.toISOString().split('T')[0])) {
          streak++;
          ref.setDate(ref.getDate() - 1);
        }
      }
    }

    // Weekly activity (Mon‑Sun)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    const weeklyDaysActive: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weeklyDaysActive.push(uniqueDates.includes(d.toISOString().split('T')[0]));
    }

    // Recent activity aggregation
    const [recentNotes, recentCompletedSubtopics, recentCompletedTopics] = await Promise.all([
      prisma.note.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { topic: { select: { title: true } } },
      }),
      prisma.subtopic.findMany({
        where: { isCompleted: true, topic: { userId } },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { topic: { select: { title: true } } },
      }),
      prisma.topic.findMany({
        where: { status: TopicStatus.COMPLETED, userId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const compiledActivity: Array<{
      id: string;
      type: 'note_added' | 'subtopic_done' | 'topic_completed';
      message: string;
      timestamp: string;
      topicTitle: string;
    }> = [];

    recentNotes.forEach(n => {
      compiledActivity.push({
        id: `note-${n.id}`,
        type: 'note_added',
        message: `Added note: "${n.content.substring(0, 45)}${n.content.length > 45 ? '...' : ''}"`,
        timestamp: n.createdAt.toISOString(),
        topicTitle: n.topic.title,
      });
    });

    recentCompletedSubtopics.forEach(s => {
      compiledActivity.push({
        id: `subtopic-${s.id}`,
        type: 'subtopic_done',
        message: `Completed "${s.title}" subtopic`,
        timestamp: s.updatedAt.toISOString(),
        topicTitle: s.topic.title,
      });
    });

    recentCompletedTopics.forEach(t => {
      compiledActivity.push({
        id: `topic-${t.id}`,
        type: 'topic_completed',
        message: 'Completed the entire topic',
        timestamp: t.updatedAt.toISOString(),
        topicTitle: t.title,
      });
    });

    const recentActivity = compiledActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return NextResponse.json({
      totalTopics,
      completedTopics: completedTopicsCount,
      inProgressTopics: inProgressTopicsCount,
      totalNotes,
      currentStreak: streak,
      weeklyGoal: 5,
      weeklyCompleted: weeklyDaysActive.filter(Boolean).length,
      totalSubtopics,
      completedSubtopics,
      overallProgress,
      streakDays: weeklyDaysActive,
      recentActivity,
    });
  } catch (error) {
    console.error('Error generating dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to generate dashboard statistics' }, { status: 500 });
  }
}
