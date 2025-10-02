'use client';

import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { HeartIcon, MessageCircleIcon } from "lucide-react";
import { FloatingChatTrigger } from "./chat/FloatingChatTrigger";

interface PostCardActionsProps {
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onComment: () => void;
  isAuthenticated: boolean;
  authorId: string;
  authorClerkId: string;
  authorUsername: string;
  authorImage: string | null;
  currentUserId: string | null;
}

export function PostCardActions({
  isLiked,
  likeCount,
  commentCount,
  onLike,
  onComment,
  isAuthenticated,
  authorId,
  authorClerkId,
  authorUsername,
  authorImage,
  currentUserId,
}: PostCardActionsProps) {
  return (
    <div className="flex items-center pt-2 space-x-4">
      {isAuthenticated ? (
        <Button
          variant="ghost"
          size="sm"
          className={`text-muted-foreground gap-2 ${
            isLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
          }`}
          onClick={onLike}
        >
          {isLiked ? (
            <HeartIcon className="size-5 fill-current" />
          ) : (
            <HeartIcon className="size-5" />
          )}
          <span>{likeCount}</span>
        </Button>
      ) : (
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
            <HeartIcon className="size-5" />
            <span>{likeCount}</span>
          </Button>
        </SignInButton>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-2 hover:text-blue-500"
        onClick={onComment}
      >
        <MessageCircleIcon className="size-5" />
        <span>{commentCount}</span>
      </Button>

      {isAuthenticated && currentUserId && authorId !== currentUserId && (
        <FloatingChatTrigger
          userId={authorClerkId}
          username={authorUsername}
          userImage={authorImage ?? "/avatar.png"}
        />
      )}
    </div>
  );
}