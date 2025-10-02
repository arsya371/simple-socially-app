import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { userId } = await auth();
    const { conversationId } = params;

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    console.log('Send message request:', { conversationId, userId, body });
    
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

    // Get the current user's database ID
    // Get both sender and receiver from database
    const [currentUser, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkId: userId }
      }),
      prisma.user.findUnique({
        where: { clerkId: receiverClerkId }
      })
    ]);

    if (!currentUser) {
      return new NextResponse('Sender not found', { status: 404 });
    }

    if (!receiver) {
      return new NextResponse('Receiver not found', { status: 404 });
    }

    // Verify the conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            id: currentUser.id
          }
        }
      }
    });

    if (!conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    // Create the message
    console.log('Creating message for conversation:', { 
      conversationId, 
      senderId: currentUser.id, 
      receiverId: receiver.id 
    });

    const message = await prisma.message.create({
      data: {
        content,
        senderId: currentUser.id,
        receiverId: receiver.id, // Use database ID instead of Clerk ID
        conversationId,
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });
    
    // Get the complete message with sender info
    const messageWithSender = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            image: true,
            clerkId: true
          }
        }
      }
    });

    if (!messageWithSender) {
      throw new Error('Failed to fetch created message');
    }

    // Map database IDs to Clerk IDs for frontend
    return NextResponse.json({
      ...messageWithSender,
      senderId: messageWithSender.sender.clerkId
    });
  } catch (error) {
    console.error('Send message error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}