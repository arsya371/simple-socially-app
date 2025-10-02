import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { LogLevel } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

export async function logApiRequest(
  req: NextRequest,
  res: NextResponse,
  startTime: number
) {
  try {
    const { userId } = await auth();
    const duration = Date.now() - startTime;
    const path = req.nextUrl.pathname;
    const method = req.method;
    const statusCode = res.status;
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const ipAddress = (
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'Unknown'
    ).split(',')[0];

    let level: LogLevel = 'INFO';
    if (statusCode >= 500) level = 'ERROR';
    else if (statusCode >= 400) level = 'WARN';

    // Extract meaningful message from the response
    let message = 'API request processed';
    let metadata = {};
    
    try {
      const resData = await res.clone().json();
      if (resData.error) {
        message = resData.error;
      }
      metadata = { ...resData };
    } catch (e) {
      // Response body might not be JSON
    }

    // Validate userId exists in database before logging
    let validUserId: string | undefined = undefined;
    
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      validUserId = userExists ? userId : undefined;
    }

    // Create the log entry
    await prisma.systemLog.create({
      data: {
        method,
        path,
        statusCode,
        duration,
        userAgent,
        userId: validUserId, // Only set if user exists
        ipAddress,
        level,
        message,
        metadata,
      },
    });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}


// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import prisma from '@/lib/prisma';
// import { LogLevel } from '@prisma/client';
// import { auth } from '@clerk/nextjs/server';

// export async function logApiRequest(
//   req: NextRequest,
//   res: NextResponse,
//   startTime: number
// ) {
//   try {
//     const { userId } = await auth();
//     const duration = Date.now() - startTime;
//     const path = req.nextUrl.pathname;
//     const method = req.method;
//     const statusCode = res.status;
//     const userAgent = req.headers.get('user-agent') || 'Unknown';
//     const ipAddress = (
//       req.headers.get('x-forwarded-for') ||
//       req.headers.get('x-real-ip') ||
//       'Unknown'
//     ).split(',')[0];

//     let level: LogLevel = 'INFO';
//     if (statusCode >= 500) level = 'ERROR';
//     else if (statusCode >= 400) level = 'WARN';

//     // Extract meaningful message from the response
//     let message = 'API request processed';
//     let metadata = {};
    
//     try {
//       const resData = await res.clone().json();
//       if (resData.error) {
//         message = resData.error;
//       }
//       metadata = { ...resData };
//     } catch (e) {
//       // Response body might not be JSON
//     }

//     // Create the log entry
//     await prisma.systemLog.create({
//       data: {
//         method,
//         path,
//         statusCode,
//         duration,
//         userAgent,
//         userId: userId || undefined, // Make userId optional
//         ipAddress,
//         level,
//         message,
//         metadata,
//       },
//     });
//   } catch (error) {
//     console.error('Failed to log API request:', error);
//   }
// }
