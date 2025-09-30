import { Suspense } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ProfilePageClient from "./ProfilePageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getProfileData(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        role: true,
        verified: true,
        isActive: true,
        banned: true,
        bannedUntil: true,
        createdAt: true, // Add this field
        suspendedUntil: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      createdAt: user.createdAt.toISOString(), // Convert Date to string
      bannedUntil: user.bannedUntil?.toISOString() || null, // Convert Date to string
      suspendedUntil: user.suspendedUntil?.toISOString() || null, // Convert Date to string
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export default async function ProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const params = await props.params;
  const user = await getProfileData(params.username);

  if (!user) {
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePageClient user={user} />
    </Suspense>
  );
}