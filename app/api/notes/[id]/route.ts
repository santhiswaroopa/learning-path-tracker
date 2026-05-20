import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const noteId = parseInt(id, 10);

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    const body = await request.json();
    const { content, isImportant } = body;

    // Check if note exists
    const existing = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        content: content !== undefined ? content : undefined,
        isImportant: isImportant !== undefined ? !!isImportant : undefined,
      },
      include: {
        topic: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
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
    const noteId = parseInt(id, 10);

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    // Check if note exists
    const existing = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
