"use server";

import prisma from "@/lib/prisma";
import { getSystemUserId } from "@/lib/system-user";
import { NotificationType } from "@prisma/client";

export async function createAdminActionNotification({
  userId,
  type,
  message,
}: {
  userId: string;
  type: NotificationType;
  message: string;
}) {
  const systemUserId = await getSystemUserId();
  
  await prisma.notification.create({
    data: {
      type,
      message,
      userId,
      creatorId: systemUserId,
    },
  });
}