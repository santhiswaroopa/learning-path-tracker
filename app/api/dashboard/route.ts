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

    // IST offset: UTC+5:30 = 330 minutes
    // Helper: convert any UTC Date to an IST "YYYY-MM-DD" date string
    const toISTDateStr = (date: Date): string => {
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h30m in ms
      const istTime = new Date(date.getTime() + IST_OFFSET_MS);
      return istTime.toISOString().split('T')[0];
    };

    // Helper: get today's date string in IST
    const todayIST = (): string => toISTDateStr(new Date());

    // Activity dates for streak calculation
    // Include subtopic updatedAt so completing a step today counts, not just when it was created
    const [topicsWithDates, subtopicsWithDates, notesWithDates] = await Promise.all([
      prisma.topic.findMany({ where: { userId }, select: { createdAt: true } }),
      prisma.subtopic.findMany({ where: { isCompleted: true, topic: { userId } }, select: { createdAt: true, updatedAt: true } }),
      prisma.note.findMany({ where: { userId }, select: { createdAt: true } }),
    ]);

    const allDates = [
      ...topicsWithDates.map(t => t.createdAt),
      // Use updatedAt (completion date) for subtopics, fall back to createdAt
      ...subtopicsWithDates.flatMap(s => [s.createdAt, s.updatedAt]),
      ...notesWithDates.map(n => n.createdAt),
    ];

    // Deduplicate into IST date strings
    const uniqueDates = Array.from(
      new Set(allDates.map(date => toISTDateStr(new Date(date))))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Shared IST date strings used by both streak and weekly sections
    const todayStr = todayIST();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = toISTDateStr(yesterdayDate);

    // Streak calculation — all comparisons in IST
    let streak = 0;
    if (uniqueDates.length > 0) {
      const hasToday = uniqueDates.includes(todayStr);
      const hasYesterday = uniqueDates.includes(yesterdayStr);

      if (hasToday || hasYesterday) {
        // Walk back from today (or yesterday if no activity today)
        let ref = new Date();
        if (!hasToday) ref.setDate(ref.getDate() - 1);
        while (uniqueDates.includes(toISTDateStr(ref))) {
          streak++;
          ref.setDate(ref.getDate() - 1);
        }
      }
    }

    // Weekly activity grid (Mon–Sun) — using IST date strings
    const todayDate = new Date(todayStr + 'T00:00:00Z'); // midnight UTC as anchor for day arithmetic
    const dayOfWeek = todayDate.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayDate = new Date(todayDate);
    mondayDate.setUTCDate(todayDate.getUTCDate() + distanceToMonday);
    const weeklyDaysActive: boolean[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setUTCDate(mondayDate.getUTCDate() + i);
      // d is already an IST-normalized date string (YYYY-MM-DD), matches uniqueDates format
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
      username: user.username,
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
