import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TopicStatus, Priority } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;
  try {
    const topics = await prisma.topic.findMany({
      where: { userId },
      include: {
        subtopics: { orderBy: { id: 'asc' } },
        _count: { select: { notes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
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
    const {
      title,
      description,
      category,
      startDate,
      targetDate,
      priority,
      status,
      subtopics,
    } = body;

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        title,
        description: description || '',
        category,
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        priority: priority || Priority.MEDIUM,
        status: status || TopicStatus.NOT_STARTED,
        progress: 0,
        userId,
        subtopics: subtopics && Array.isArray(subtopics)
          ? { create: subtopics.map((title: string) => ({ title, isCompleted: false })) }
          : undefined,
      },
      include: { subtopics: true },
    });
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
