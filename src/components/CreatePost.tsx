"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { AlertCircle, ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { Button } from "./ui/button";
import { createModeratedPost } from "@/actions/moderation.action";
import { checkUserSuspension } from "@/actions/post.action";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import { useEffect } from "react";
import { Alert, AlertDescription } from "./ui/alert";

function CreatePost() {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);

  // Check for suspension status when component mounts
  useEffect(() => {
    const checkSuspension = async () => {
      if (!user) return;
      try {
        const status = await checkUserSuspension(user.id);
        if (status.isSuspended) {
          setError(status.message || 'Your account is currently suspended');
          setIsSuspended(true);
        } else {
          setError(null);
          setIsSuspended(false);
        }
      } catch (error) {
        console.error('Error checking suspension status:', error);
        setError('Unable to check account status');
      }
    };
    checkSuspension();
  }, [user]);

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) return;

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('image', imageUrl);
      const result = await createModeratedPost(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      
      // reset the form
      setContent("");
      setImageUrl("");
      setShowImageUpload(false);
      setError(null);
      toast.success("Post created successfully");
    } catch (error: any) {
      console.error("Failed to create post:", error);
      if (error.message.includes("Your account is currently suspended")) {
        setError(error.message);
      } else {
        toast.error("Failed to create post");
      }
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border bg-card">
      <CardContent className="p-4 sm:p-6">
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 border bg-muted">
              <AvatarImage src={user?.imageUrl || "/avatar.png"} alt={user?.username || "User avatar"} />
            </Avatar>
            <Textarea
              placeholder="What's on your mind?"
              className="min-h-[120px] resize-none text-base leading-relaxed bg-background focus-visible:ring-1"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSuspended || isPosting}
            />
          </div>

          {(showImageUpload || imageUrl) && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <ImageUpload
                endpoint="postImage"
                value={imageUrl}
                onChange={(url) => {
                  setImageUrl(url);
                  if (!url) setShowImageUpload(false);
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-9 px-4 gap-2 ${imageUrl ? 'text-primary hover:text-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isPosting || !!error}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Photo</span>
              </Button>
            </div>
            <Button
              size="sm"
              className="h-9 px-4 gap-2"
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageUrl) || isPosting || !!error}
              title={error ? error : undefined}
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4" />
                  <span>Post</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default CreatePost;