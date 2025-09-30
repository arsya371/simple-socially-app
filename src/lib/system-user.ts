import prisma from "./prisma";

let systemUserId: string | null = null;

export async function getSystemUserId(): Promise<string> {
  if (systemUserId) return systemUserId;

  // Try to find existing system user
  const systemUser = await prisma.user.findFirst({
    where: {
      username: "system",
      role: "ADMIN"
    }
  });

  if (systemUser) {
    systemUserId = systemUser.id;
    return systemUser.id;
  }

  // Create system user if doesn't exist
  const newSystemUser = await prisma.user.create({
    data: {
      username: "system",
      role: "ADMIN",
      name: "System",
      clerkId: "system",
      email: "system@example.com",
      image: "/avatar.png"
    }
  });

  systemUserId = newSystemUser.id;
  return newSystemUser.id;
}