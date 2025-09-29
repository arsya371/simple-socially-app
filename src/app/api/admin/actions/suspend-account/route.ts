import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId, duration } = await req.json();

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true }
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (duration === "permanent") {
      // Permanently delete the account
      await prisma.user.delete({
        where: { id: targetUserId }
      });

      await prisma.adminAuditLog.create({
        data: {
          action: "ACCOUNT_DELETED",
          details: "Account permanently deleted",
          performedById: admin.id,
          performedOn: targetUserId
        }
      });

      return NextResponse.json({ message: "Account permanently deleted" });
    } else {
      // Temporary suspension
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(duration));

      await prisma.user.update({
        where: { id: targetUserId },
        data: { suspendedUntil }
      });

      await prisma.adminAuditLog.create({
        data: {
          action: "ACCOUNT_SUSPENDED",
          details: `Account suspended for ${duration} days`,
          performedById: admin.id,
          performedOn: targetUserId
        }
      });

      return NextResponse.json({ message: "Account suspended" });
    }
  } catch (error) {
    console.error("[ADMIN_SUSPEND_ACCOUNT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}