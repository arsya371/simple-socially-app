import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { formatTimeToNow } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import PostActions from "@/components/admin/PostActions";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          username: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Post Management</h1>
      </div>

      <div className="space-y-4">
        {posts.map((post: any) => (
          <Card key={post.id} className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {post.author.image && (
                    <Image
                      src={post.author.image}
                      alt={post.author.username}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <Link 
                      href={`/profile/${post.author.username}`}
                      className="font-semibold hover:underline"
                    >
                      {post.author.username}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeToNow(new Date(post.createdAt))}
                    </p>
                  </div>
                </div>
                <PostActions postId={post.id} />
              </div>

              <div className="space-y-2">
                {post.content && (
                  <p className="text-sm">{post.content}</p>
                )}
                {post.image && (
                  <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
                    <Image
                      src={post.image}
                      alt="Post image"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <p>{post._count.likes} likes</p>
                <p>{post._count.comments} comments</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}