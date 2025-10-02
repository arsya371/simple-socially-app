import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { receiverId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const receiverClerkId = params.receiverId;

    // Get both sender and receiver from database
    const [currentUser, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          clerkId: true,
        }
      }),
      prisma.user.findUnique({
        where: { clerkId: receiverClerkId },
        select: {
          id: true,
          clerkId: true,
        }
      })
    ]);

    if (!currentUser || !receiver) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Find conversation between users
    const conversation = await prisma.conversation.findFirst({
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
                id: receiver.id
              }
            }
          }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    // Get recent messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({
      messages: messages.reverse()
    });
    
  } catch (error) {
    console.error('Error loading messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}