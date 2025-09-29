import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { type, targetId } = body;

    if (!type || !targetId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    switch (type) {
      case "POST":
        await prisma.post.delete({
          where: { id: targetId }
        });
        break;
      case "COMMENT":
        await prisma.comment.delete({
          where: { id: targetId }
        });
        break;
      default:
        return new NextResponse("Invalid content type", { status: 400 });
    }

    return NextResponse.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("[ADMIN_DELETE_CONTENT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}