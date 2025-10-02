import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = await auth();
    const { conversationId } = params;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the database user ID from Clerk ID
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!currentUser) {
      console.error('User not found in database:', userId);
      return new NextResponse('User not found', { status: 404 });
    }

    // Get conversation with messages and participants
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: currentUser.id
          }
        }
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                image: true,
                clerkId: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        participants: {
          where: { id: { not: currentUser.id } },
          select: {
            id: true,
            username: true,
            image: true,
            clerkId: true,
          },
        },
      },
    });

    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    // Get the other participant
    if (conversation.participants.length === 0) {
      return new NextResponse('Other participant not found', { status: 404 });
    }

    const otherUser = conversation.participants[0];

    // Update the unread status of messages
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: currentUser.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      messages: conversation.messages.map(msg => ({
        ...msg,
        senderId: msg.sender.clerkId // Map database ID to Clerk ID for frontend
      })),
      otherUser: {
        ...otherUser,
        id: otherUser.clerkId // Map database ID to Clerk ID for frontend
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}