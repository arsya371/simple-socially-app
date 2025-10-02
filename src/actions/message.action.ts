'use server';

import prisma from '@/lib/prisma';

export async function getMessages(userId: string, otherUserId: string) {
  try {
    // First, find the conversation between these users
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: otherUserId } } }
        ]
      }
    });

    if (!conversation) {
      return { success: true, data: [] };
    }

    // Get messages for this conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        OR: [
          { deleteForEveryone: false },
          { AND: [
            { deletedBy: { not: userId } },
            { deleteForEveryone: false }
          ]}
        ]
      },
      include: {
        sender: {
          select: {
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return { success: true, data: messages };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { success: false, error: 'Failed to get messages' };
  }
}

export async function deleteMessage(messageId: string, userId: string, deleteForEveryone: boolean = false) {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { 
        sender: true,
        conversation: true
      }
    });

    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    // Check if user is authorized to delete this message
    if (message.senderId !== userId) {
      return { success: false, error: 'Unauthorized to delete this message' };
    }

    // Update the message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        deleteForEveryone: deleteForEveryone
      }
    });

    return { 
      success: true, 
      data: updatedMessage,
      conversationId: message.conversationId 
    };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { success: false, error: 'Failed to delete message' };
  }
}

export async function deleteAllMessages(conversationId: string, userId: string, deleteForEveryone: boolean = false) {
  try {
    // Update all messages in the conversation
    const result = await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: userId // Only delete messages sent by the user
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        deleteForEveryone: deleteForEveryone
      }
    });

    return { 
      success: true, 
      data: result,
      conversationId 
    };
  } catch (error) {
    console.error('Error deleting all messages:', error);
    return { success: false, error: 'Failed to delete all messages' };
  }
}