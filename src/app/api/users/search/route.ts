import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!query) {
      return NextResponse.json([]);
    }

    // First get the current user's database ID
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ],
        AND: {
          id: { not: currentUser.id }, // Exclude the current user using DB ID
        }
      },
      select: {
        id: true,
        username: true,
        image: true,
      },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('User search error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}