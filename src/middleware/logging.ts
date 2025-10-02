import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const response = NextResponse.next();

  try {
    // Only log API requests
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log the request
      await prisma.systemLog.create({
        data: {
          method: request.method,
          path: request.nextUrl.pathname,
          statusCode: response.status,
          duration,
          userAgent: request.headers.get('user-agent') || 'unknown',
          ipAddress: request.ip || 'unknown',
          timestamp: new Date(),
          level: response.status >= 400 ? 'ERROR' : 'INFO'
        }
      });
    }
  } catch (error) {
    console.error('Error logging request:', error);
  }

  return response;
}