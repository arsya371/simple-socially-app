import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Server as SocketIOServer } from 'socket.io';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    console.log('Send floating message request:', { userId, body });
    
    const { content, receiverId: receiverClerkId } = body;

    if (!content || !receiverClerkId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    if (content.length > 2000) {
      return new NextResponse('Message too long', { status: 400 });
    }

    if (content.trim().length === 0) {
      return new NextResponse('Message cannot be empty', { status: 400 });
    }

    // Get both sender and receiver from database
    const [currentUser, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          clerkId: true,
          username: true,
          image: true
        }
      }),
      prisma.user.findUnique({
        where: { clerkId: receiverClerkId },
        select: {
          id: true,
          clerkId: true,
          username: true,
          image: true
        }
      })
    ]);

    if (!currentUser) {
      return new NextResponse('Sender not found', { status: 404 });
    }

    if (!receiver) {
      return new NextResponse('Receiver not found', { status: 404 });
    }

    // Find existing conversation
    let conversation = await prisma.conversation.findFirst({
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

    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [
              { id: currentUser.id },
              { id: receiver.id }
            ]
          }
        }
      });
    }

    // Create new message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId: conversation.id,
        senderId: currentUser.id,
        receiverId: receiver.id
      },
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

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { 
        updatedAt: new Date() 
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending floating message:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}