import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ isAdmin: false }, { status: 200 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    return NextResponse.json({ isAdmin: user?.role === 'ADMIN' }, { status: 200 });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}


