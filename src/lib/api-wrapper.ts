import { NextRequest, NextResponse } from 'next/server';
import { logApiRequest } from '@/middleware/api-logger';

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export function withLogging(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req);
      
      // Log the request after processing
      await logApiRequest(req, response, startTime);
      
      return response;
    } catch (error: any) {
      // Create error response
      const errorResponse = NextResponse.json(
        { error: error.message || 'Internal Server Error' },
        { status: error.status || 500 }
      );
      
      // Log the error request
      await logApiRequest(req, errorResponse, startTime);
      
      return errorResponse;
    }
  };
}