import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First get the database user ID from Clerk ID
    const currentUser = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get all conversations for the user
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: currentUser.id
          }
        }
      },
      orderBy: {
        messages: {
          _count: 'desc' // Sort by number of messages to show most active chats first
        }
      },
      include: {
        participants: {
          where: {
            id: {
              not: currentUser.id
            }
          },
          select: {
            id: true,
            username: true,
            image: true,
            isOnline: true,
            lastSeen: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1, // Get most recent message
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            read: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: currentUser.id,
                read: false,
              }
            }
          }
        }
      },
      // orderBy: {
      //   updatedAt: 'desc'
      // }
    });

    // Transform the data to match the frontend interface and filter out invalid conversations
    const formattedConversations = conversations
      .filter(conv => conv.participants.length > 0) // Only include conversations with participants
      .map((conv) => ({
        id: conv.id,
        lastMessage: conv.messages[0] || null,
        otherUser: conv.participants[0],
        unreadCount: conv._count.messages,
      }));

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}