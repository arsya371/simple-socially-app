"use client";

import { createComment, deletePost, getPosts, toggleLike } from "@/actions/post.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "./DeletAlertDialog";
import { Button } from "./ui/button";
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon, Flag } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { ReportDialog } from "./ReportDialog";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some((like: any) => like.userId === dbUserId));
  const [optimisticLikes, setOptimisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState(post.comments);

  const handleLike = async () => {
    if (isLiking) return;
    
    const previousLiked = hasLiked;
    const previousLikes = optimisticLikes;
    
    try {
      setIsLiking(true);
      setHasLiked(!previousLiked);
      setOptimisticLikes((prev: any) => prev + (!previousLiked ? 1 : -1));
      await toggleLike(post.id);
    } catch (error) {
      setOptimisticLikes(previousLikes);
      setHasLiked(previousLiked);
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting || !user) return;
    
    const optimisticComment = {
      id: 'temp-' + Date.now(),
      content: newComment,
      createdAt: new Date(),
      authorId: dbUserId!,
      postId: post.id,
      author: {
        id: dbUserId!,
        name: user.fullName || user.username || 'User',
        username: user.username || user.emailAddresses?.[0]?.emailAddress.split('@')[0] || 'user', // Ensure username is always a string    
        image: user.imageUrl,
      },
    };

    try {
      setIsCommenting(true);
      setOptimisticComments((prev: any) => [optimisticComment, ...prev]);
      const result = await createComment(post.id, newComment);

      if (result?.success) {
        setNewComment("");
        if (result.comment) {
          setOptimisticComments((prev: any) =>
            prev.map((c: any) => (c.id === optimisticComment.id ? result.comment : c))
          );
        } else {
          setOptimisticComments((prev: any) => prev.filter((c: any) => c.id !== optimisticComment.id));
        }
      } else if (result) {
        setOptimisticComments((prev: any) => prev.filter((c: any) => c.id !== optimisticComment.id));
        throw new Error(result?.error || "Failed to post comment");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to post comment");
      setOptimisticComments((prev: any) => prev.filter((c: any) => c.id !== optimisticComment.id));
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);
      if (result.success) toast.success("Post deleted successfully");
      else throw new Error(result.error);
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <Link href={`/profile/${post.author.username}`} className="shrink-0">
              <Avatar className="h-10 w-10 border bg-muted">
                <AvatarImage src={post.author.image ?? "/avatar.png"} alt={post.author.name ?? "User"} />
              </Avatar>
            </Link>

            {/* POST HEADER & TEXT CONTENT */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="font-semibold hover:underline truncate"
                  >
                    {post.author.name ?? "User"}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href={`/profile/${post.author.username}`} className="hover:underline">@{post.author.username}</Link>
                    <span className="text-xs">•</span>
                    <span className="text-xs">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                  </div>
                </div>
                {/* Action buttons for post author or report */}
                <div className="flex items-center gap-1">
                  {dbUserId === post.author.id ? (
                    <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                  ) : dbUserId && (
                    <ReportDialog type="POST" targetId={post.id} />
                  )}
                </div>
              </div>
              <p className="mt-2 text-sm text-foreground break-words">{post.content}</p>
            </div>
          </div>

          {/* POST IMAGE */}
          {post.image && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img 
                src={post.image} 
                alt="Post content" 
                className="absolute inset-0 h-full w-full object-cover transition-opacity hover:opacity-95" 
              />
            </div>
          )}

          {/* LIKE & COMMENT BUTTONS */}
          <div className="flex items-center pt-3 space-x-4 border-t">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 px-4 text-muted-foreground gap-2 ${
                  hasLiked ? "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300" : "hover:text-red-500 dark:hover:text-red-400"
                }`}
                onClick={handleLike}
                disabled={isLiking}
              >
                {hasLiked ? (
                  <HeartIcon className="h-4 w-4 fill-current" />
                ) : (
                  <HeartIcon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{optimisticLikes}</span>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                  <HeartIcon className="size-5" />
                  <span>{optimisticLikes}</span>
                </Button>
              </SignInButton>
            )}

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 px-4 text-muted-foreground gap-2 ${showComments ? "text-blue-500 dark:text-blue-400" : "hover:text-blue-500 dark:hover:text-blue-400"}`}
              onClick={() => setShowComments((prev) => !prev)}
            >
              <MessageCircleIcon
                className={`h-4 w-4 ${showComments ? "fill-current" : ""}`}
              />
              <span className="text-sm font-medium">{optimisticComments.length}</span>
            </Button>
          </div>

          {/* COMMENTS SECTION */}
          {showComments && (
            <div className="space-y-4 pt-4">
              <div className="space-y-4">
                {/* DISPLAY COMMENTS */}
                {optimisticComments.map((comment: any) => {
                  const isOptimistic = comment.id.toString().startsWith('temp-');
                  return (
                    <div 
                      key={comment.id} 
                      className={`group flex space-x-3 hover:bg-muted/50 -mx-6 px-6 py-2 transition-colors ${
                        isOptimistic ? 'opacity-70' : ''
                      }`} 
                    >
                      <Link href={`/profile/${comment.author.username}`} className="shrink-0">
                        <Avatar className="h-8 w-8 border bg-muted">
                          <AvatarImage src={comment.author.image ?? "/avatar.png"} alt={comment.author.name ?? "User"} />
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link href={`/profile/${comment.author.username}`} className="font-medium text-sm hover:underline">
                            {comment.author.name ?? "User"}
                          </Link>
                          <Link href={`/profile/${comment.author.username}`} className="text-xs text-muted-foreground hover:underline">
                            @{comment.author.username}
                          </Link>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {isOptimistic ? 'Just now' : formatDistanceToNow(new Date(comment.createdAt)) + ' ago'}
                          </span>
                        </div>
                        <p className="text-sm break-words leading-normal">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {user ? (
                <div className="flex items-start space-x-3 pt-2">
                  <Avatar className="h-8 w-8 border bg-muted">
                    <AvatarImage src={user?.imageUrl || "/avatar.png"} alt={user?.username || "User avatar"} />
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none text-sm leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        className="h-9 px-4 gap-2"
                        disabled={!newComment.trim() || isCommenting}
                      >
                        {isCommenting ? (
                          "Posting..."
                        ) : (
                          <>
                            <SendIcon className="h-4 w-4" />
                            <span>Comment</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-6">
                  <SignInButton mode="modal">
                    <Button variant="outline" size="sm" className="h-9 px-4 gap-2">
                      <LogInIcon className="h-4 w-4" />
                      <span>Sign in to comment</span>
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
export default PostCard;