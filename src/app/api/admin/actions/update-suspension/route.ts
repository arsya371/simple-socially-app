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

    const suspendUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        suspendedUntil: suspendUntil,
        isActive: !suspendUntil
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        action: "UPDATE_SUSPENSION",
        details: `Updated suspension duration for user ${targetUser.username} to ${duration ? `${duration} days` : 'removed'}`,
        performedById: admin.id,
        performedOn: targetUserId
      }
    });

    // Create notification
    await createAdminActionNotification({
      userId: targetUserId,
      type: duration ? NotificationType.ACCOUNT_SUSPENDED : NotificationType.ACCOUNT_ACTIVATED,
      message: duration 
        ? `Your account suspension has been updated to ${duration} days.`
        : "Your account suspension has been removed. You can now access all features."
    });

    return NextResponse.json({ message: "Suspension updated successfully" });
  } catch (error) {
    console.error("[ADMIN_UPDATE_SUSPENSION]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
