import { notFound } from "next/navigation";
import { getProfileByUsername, getUserPosts } from "@/actions/profile.action";
import { Card } from "@/components/ui/card";
import ProfilePageClient from "./ProfilePageClient";
import { currentUser } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/actions/user.action";
import prisma from "@/lib/prisma";
import { Metadata } from "next";

type Props = {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) {
    return {
      title: "User Not Found",
      description: "This user profile could not be found."
    };
  }
  return {
    title: `${profile.name || profile.username} | Profile`,
    description: profile.bio || `Check out ${profile.username}'s profile`
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const user = await currentUser();
  const profile = await getProfileByUsername(username);
  if (!profile) {
    notFound();
  }

  const [posts, likedPosts] = await Promise.all([
    getUserPosts(profile.id),
    prisma.post.findMany({
      where: {
        likes: {
          some: {
            userId: profile.id
          }
        }
      },
      include: {
        author: true,
        likes: true,
        comments: {
          include: {
            author: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  ]);

  let isFollowing = false;
  
  if (user?.id) {
    const currentUserDb = await getUserByClerkId(user.id);
    if (currentUserDb) {
      const followExists = await prisma.follows.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserDb.id,
            followingId: profile.id
          }
        }
      });
      isFollowing = !!followExists;
    }
  }

  const suspendedUser = await prisma.user.findUnique({
    where: { id: profile.id },
    select: { suspendedUntil: true }
  });

  const suspendedUntil = suspendedUser?.suspendedUntil || null;
  const isActive = !suspendedUntil || suspendedUntil < new Date();

  return (
    <div className="container max-w-4xl py-6">
      <Card className="relative">
        <ProfilePageClient
          user={{ ...profile, isActive, suspendedUntil }}
          posts={posts}
          likedPosts={likedPosts}
          isFollowing={isFollowing}
        />
      </Card>
    </div>
  );
}