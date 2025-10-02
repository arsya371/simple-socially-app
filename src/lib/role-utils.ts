import prisma from "./prisma";
import { Role } from "@prisma/client";

export async function updateUserRole(userId: string, role: Role) {
  return await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function getUsersByRole(role: Role) {
  return await prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
    },
  });
}

export async function getRoleStats() {
  const stats = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });
  
  return stats.reduce((acc: { [key: string]: number }, stat) => {
    acc[stat.role] = stat._count;
    return acc;
  }, {});
}