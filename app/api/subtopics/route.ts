import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TopicStatus } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const body = await request.json();
    const { topicId, title } = body;

    if (!topicId || !title?.trim()) {
      return NextResponse.json(
        { error: 'topicId and title are required' },
        { status: 400 }
      );
    }

    // Verify topic belongs to user
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic || topic.userId !== userId) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Create the new subtopic
    const subtopic = await prisma.subtopic.create({
      data: { title: title.trim(), isCompleted: false, topicId },
    });

    // Recalculate parent topic progress & status
    const allSubtopics = await prisma.subtopic.findMany({ where: { topicId } });
    const total = allSubtopics.length;
    const completed = allSubtopics.filter((s) => s.isCompleted).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    let status: TopicStatus = TopicStatus.IN_PROGRESS;
    if (progress === 100) status = TopicStatus.COMPLETED;
    else if (progress === 0) status = TopicStatus.NOT_STARTED;

    await prisma.topic.update({
      where: { id: topicId },
      data: { progress, status },
    });

    return NextResponse.json({ subtopic, topicProgress: progress, topicStatus: status }, { status: 201 });
  } catch (error) {
    console.error('Error creating subtopic:', error);
    return NextResponse.json({ error: 'Failed to create subtopic' }, { status: 500 });
  }
}
