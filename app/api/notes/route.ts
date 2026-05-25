import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;
  try {
    const { searchParams } = new URL(request.url);
    const topicIdParam = searchParams.get('topicId');

    const filter: any = {};
    if (topicIdParam) {
      const topicId = parseInt(topicIdParam, 10);
      if (!isNaN(topicId)) {
        filter.topicId = topicId;
      }
    }
    // Ensure notes belong to user's topics
    const notes = await prisma.note.findMany({
      where: {
        ...filter,
        topic: { userId },
      },
      include: {
        topic: {
          select: { id: true, title: true },
        },
        subtopic: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;
  try {
    const body = await request.json();
    const { topicId, subtopicId, content, isImportant } = body;

    if (!topicId || !content) {
      return NextResponse.json({ error: 'TopicId and content are required' }, { status: 400 });
    }

    const topicIdNum = parseInt(topicId, 10);
    if (isNaN(topicIdNum)) {
      return NextResponse.json({ error: 'Invalid topicId' }, { status: 400 });
    }

    const subtopicIdNum: number | undefined = subtopicId != null
      ? (typeof subtopicId === 'number' ? subtopicId : parseInt(subtopicId, 10))
      : undefined;
    if (subtopicIdNum !== undefined && isNaN(subtopicIdNum)) {
      return NextResponse.json({ error: 'Invalid subtopicId' }, { status: 400 });
    }

    // Verify topic belongs to user
    const topic = await prisma.topic.findUnique({ where: { id: topicIdNum } });
    if (!topic || topic.userId !== userId) {
      return NextResponse.json({ error: 'Topic not found or unauthorized' }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        topicId: topicIdNum,
        subtopicId: subtopicIdNum,
        content,
        isImportant: !!isImportant,
        userId,
      },
      include: {
        topic: {
          select: { id: true, title: true },
        },
        subtopic: {
          select: { id: true, title: true },
        },
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
