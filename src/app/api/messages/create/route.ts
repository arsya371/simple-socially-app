import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userId: otherUserId } = await request.json();

    if (!otherUserId) {
      return new NextResponse('Missing user ID', { status: 400 });
    }

    // First verify both users exist
    const [currentUser, otherUser] = await Promise.all([
      prisma.user.findUnique({ where: { clerkId: userId } }),
      prisma.user.findUnique({ where: { id: otherUserId } })
    ]);

    if (!currentUser || !otherUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if there's a conversation between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                id: currentUser.id
              }
            }
          },
          {
            participants: {
              some: {
                id: otherUser.id
              }
            }
          }
        ]
      }
    });

    if (existingConversation) {
      return NextResponse.json({ 
        conversationId: existingConversation.id,
        isNew: false
      });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [
            { id: currentUser.id },
            { id: otherUser.id }
          ]
        }
      }
    });

    // Create initial message
    await prisma.message.create({
      data: {
        content: "Chat started",
        sender: {
          connect: { id: currentUser.id }
        },
        receiver: {
          connect: { id: otherUser.id }
        },
        conversation: {
          connect: { id: conversation.id }
        },
        read: false
      }
    });

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Create conversation error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}