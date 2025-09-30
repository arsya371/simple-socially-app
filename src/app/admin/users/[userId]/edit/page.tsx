import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserSettings } from "@/components/admin/UserSettings";

interface EditUserPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const resolvedParams = await params;
  
  if (!resolvedParams?.userId) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: resolvedParams.userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      verified: true,
      banned: true,
      email: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-6">
      <UserSettings
        userId={user.id}
        username={user.username}
        name={user.name || ""}
        currentRole={user.role}
        isActive={user.isActive}
        isVerified={user.verified}
        isBanned={user.banned}
        email={user.email}
      />
    </div>
  );
}