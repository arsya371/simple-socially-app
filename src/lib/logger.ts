import prisma from './prisma';
import { auth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { LogLevel } from '@prisma/client';

interface LogOptions {
  level?: LogLevel;
  userId?: string;
  metadata?: any;
}

export async function logActivity(
  message: string,
  path: string,
  method: string,
  statusCode: number,
  duration: number,
  options: LogOptions = {}
) {
  try {
    const headersList = headers();
    const { userId } = await auth();

    const userAgent = headersList.get('user-agent') || 'Unknown';
    const ipAddress = (
      headersList.get('x-forwarded-for') || 
      headersList.get('x-real-ip') || 
      'Unknown'
    ).split(',')[0];

    await prisma.systemLog.create({
      data: {
        message,
        path,
        method,
        statusCode,
        duration,
        level: options.level || 'INFO',
        userId: options.userId || userId || undefined,
        userAgent,
        ipAddress,
        metadata: options.metadata || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Utility function to time API calls and log them
export async function withLogging<T>(
  path: string,
  method: string,
  handler: () => Promise<T>,
  options: LogOptions = {}
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await handler();
    const duration = Date.now() - startTime;
    
    await logActivity(
      options.metadata?.message || 'Request successful',
      path,
      method,
      200,
      duration,
      {
        ...options,
        metadata: {
          ...options.metadata,
          success: true,
        },
      }
    );
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    await logActivity(
      error.message || 'Request failed',
      path,
      method,
      error.status || 500,
      duration,
      {
        level: 'ERROR',
        ...options,
        metadata: {
          ...options.metadata,
          error: error.message,
          stack: error.stack,
        },
      }
    );
    
    throw error;
  }
}

// Role change logging
export async function logRoleChange(
  targetUserId: string,
  oldRole: string,
  newRole: string,
  changedById: string
) {
  await logActivity(
    `User role changed from ${oldRole} to ${newRole}`,
    '/api/admin/users',
    'PUT',
    200,
    0,
    {
      level: 'INFO',
      userId: changedById,
      metadata: {
        targetUserId,
        oldRole,
        newRole,
        action: 'ROLE_CHANGE'
      }
    }
  );
}

// User status change logging
export async function logStatusChange(
  targetUserId: string,
  oldStatus: string,
  newStatus: string,
  reason: string,
  changedById: string
) {
  await logActivity(
    `User status changed from ${oldStatus} to ${newStatus}`,
    '/api/admin/users',
    'PUT',
    200,
    0,
    {
      level: 'INFO',
      userId: changedById,
      metadata: {
        targetUserId,
        oldStatus,
        newStatus,
        reason,
        action: 'STATUS_CHANGE'
      }
    }
  );
}

// Content moderation logging
export async function logModeration(
  contentType: 'POST' | 'COMMENT',
  contentId: string,
  action: 'REMOVE' | 'RESTORE',
  reason: string,
  moderatorId: string
) {
  await logActivity(
    `Content ${action.toLowerCase()}d: ${contentType.toLowerCase()}`,
    '/api/moderator/content',
    'PUT',
    200,
    0,
    {
      level: 'INFO',
      userId: moderatorId,
      metadata: {
        contentType,
        contentId,
        action,
        reason,
        type: 'MODERATION'
      }
    }
  );
}

// System settings change logging
export async function logSettingChange(
  setting: string,
  oldValue: string,
  newValue: string,
  adminId: string
) {
  await logActivity(
    `System setting "${setting}" changed`,
    '/api/admin/settings',
    'PUT',
    200,
    0,
    {
      level: 'INFO',
      userId: adminId,
      metadata: {
        setting,
        oldValue,
        newValue,
        action: 'SETTING_CHANGE'
      }
    }
  );
}

// User action logging (follows, likes, etc.)
export async function logUserAction(
  action: 'FOLLOW' | 'UNFOLLOW' | 'LIKE' | 'UNLIKE' | 'POST' | 'COMMENT',
  targetId: string,
  userId: string
) {
  await logActivity(
    `User ${action.toLowerCase()}ed`,
    `/api/users/actions`,
    'POST',
    200,
    0,
    {
      level: 'INFO',
      userId,
      metadata: {
        action,
        targetId,
        type: 'USER_ACTION'
      }
    }
  );
}