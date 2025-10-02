import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withLogging } from "@/lib/api-wrapper";
import { checkRoleAuth } from "@/lib/role-middleware";

export const dynamic = 'force-dynamic';

export const GET = withLogging(async (req: NextRequest) => {
  const auth = await checkRoleAuth(["ADMIN"]);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error?.includes("sign in") ? 401 : 403 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
});

export const PUT = withLogging(async (req: NextRequest) => {
  const auth = await checkRoleAuth(["ADMIN"]);

  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error?.includes("sign in") ? 401 : 403 }
    );
  }

  try {
    const data = await req.json();
    const { userId, role, status } = data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role, status }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
});