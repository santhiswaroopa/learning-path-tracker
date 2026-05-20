import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TopicStatus } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const { id } = await params;
    const subtopicId = parseInt(id, 10);

    if (isNaN(subtopicId)) {
      return NextResponse.json({ error: 'Invalid subtopic ID' }, { status: 400 });
    }

    const body = await request.json();
    const { isCompleted } = body;

    if (isCompleted === undefined || typeof isCompleted !== 'boolean') {
      return NextResponse.json(
        { error: 'isCompleted field (boolean) is required' },
        { status: 400 }
      );
    }

    // Check if subtopic exists and belongs to the user
    const subtopic = await prisma.subtopic.findUnique({
      where: { id: subtopicId },
      include: { topic: true },
    });

    if (!subtopic || subtopic.topic.userId !== userId) {
      return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });
    }

    // Update subtopic
    const updatedSubtopic = await prisma.subtopic.update({
      where: { id: subtopicId },
      data: { isCompleted },
    });

    // Recalculate parent Topic progress
    const siblingSubtopics = await prisma.subtopic.findMany({
      where: { topicId: subtopic.topicId },
    });

    const total = siblingSubtopics.length;
    const completed = siblingSubtopics.filter((s) => s.isCompleted).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Determine status
    let status: TopicStatus = TopicStatus.IN_PROGRESS;
    if (progress === 100) {
      status = TopicStatus.COMPLETED;
    } else if (progress === 0) {
      status = TopicStatus.NOT_STARTED;
    }

    // Update parent topic
    await prisma.topic.update({
      where: { id: subtopic.topicId },
      data: { progress, status },
    });

    return NextResponse.json({
      subtopic: updatedSubtopic,
      topicProgress: progress,
      topicStatus: status,
    });
  } catch (error) {
    console.error('Error updating subtopic:', error);
    return NextResponse.json(
      { error: 'Failed to update subtopic' },
      { status: 500 }
    );
  }
}
