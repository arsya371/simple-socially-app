import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { createAdminActionNotification } from "@/actions/admin-notification.action";
import { NotificationType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: targetUserId, duration } = await req.json();

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

      // Create notification
      await createAdminActionNotification({
        userId: targetUserId,
        type: NotificationType.ACCOUNT_SUSPENDED,
        message: `Your account has been suspended for ${duration} days. Contact support for more information.`
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