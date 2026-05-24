import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TopicStatus, Priority } from '@prisma/client';
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
    const topicId = parseInt(id, 10);

    if (isNaN(topicId)) {
      return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      startDate,
      targetDate,
      status,
      progress,
      priority,
    } = body;

    // Check if topic exists
    const existing = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Dynamic defaults: if progress is set to 100, set status to COMPLETED.
    // If status is set to COMPLETED, set progress to 100.
    let updatedStatus = status;
    let updatedProgress = progress;

    if (progress !== undefined) {
      const progNum = parseInt(progress, 10);
      updatedProgress = Math.min(100, Math.max(0, isNaN(progNum) ? 0 : progNum));
      if (updatedProgress === 100 && !status) {
        updatedStatus = TopicStatus.COMPLETED;
      } else if (updatedProgress < 100 && existing.status === TopicStatus.COMPLETED && !status) {
        updatedStatus = TopicStatus.IN_PROGRESS;
      }
    }

    if (status !== undefined) {
      if (status === TopicStatus.COMPLETED && progress === undefined) {
        updatedProgress = 100;
      } else if (status === TopicStatus.NOT_STARTED && progress === undefined) {
        updatedProgress = 0;
      }
    }

    // Sync subtopics if status or progress is explicitly updated
    if (status !== undefined || progress !== undefined) {
      const isSubtopicCompleted = updatedStatus === TopicStatus.COMPLETED;
      await prisma.subtopic.updateMany({
        where: { topicId },
        data: { isCompleted: isSubtopicCompleted },
      });
    }

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        targetDate: targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : undefined,
        status: updatedStatus,
        progress: updatedProgress !== undefined ? updatedProgress : undefined,
        priority: priority !== undefined ? priority : undefined,
      },
      include: {
        subtopics: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const { id } = await params;
    const topicId = parseInt(id, 10);

    if (isNaN(topicId)) {
      return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 });
    }

    // Check if topic exists
    const existing = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    await prisma.topic.delete({
      where: { id: topicId },
    });

    return NextResponse.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}
