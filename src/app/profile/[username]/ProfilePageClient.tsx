"use client";

import { getProfileByUsername, updateProfile } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, useUser } from "@clerk/nextjs";
import { format, parseISO } from "date-fns";
import {
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
} from "lucide-react";
import { ReportDialog } from "@/components/ReportDialog";
import { UserBadges } from "@/components/UserBadges";
import { getUserPosts } from "@/actions/post.action";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string | null;
  username: string;
  bio: string | null;
  image: string | null;
  location: string | null;
  website: string | null;
  role: string;
  verified: boolean;
  isActive: boolean;
  banned: boolean;
  bannedUntil: string | null;
  createdAt: string;
  suspendedUntil: string | null;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

interface ProfilePageClientProps {
  user: NonNullable<User> & {
    isActive?: boolean;
    suspendedUntil?: string | null;
  };
}

function ProfilePageClient({ user }: ProfilePageClientProps) {
  const { user: currentUser } = useUser();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"posts" | "likes">("posts");
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleTabChange = (value: string) => {
    setSelectedTab(value as "posts" | "likes");
  };

  const handleEditSubmit = async () => {
    setIsUpdating(true);
    const loadingToast = toast.loading("Updating profile...");

    try {
      const formData = new FormData();
      Object.entries(editForm).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const result = await updateProfile(formData);
      if (result.success) {
        setShowEditDialog(false);
        toast.success("Profile updated successfully");
      } else {
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("[PROFILE_UPDATE]", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      toast.dismiss(loadingToast);
      setIsUpdating(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("You must be signed in to follow users");
      return;
    }

    const loadingToast = toast.loading(
      isFollowing ? "Unfollowing user..." : "Following user..."
    );

    try {
      setIsUpdatingFollow(true);
      await toggleFollow(user.id);
      setIsFollowing(!isFollowing);
      toast.success(
        isFollowing ? "Successfully unfollowed" : "Successfully followed"
      );
    } catch (error: any) {
      console.error("[FOLLOW_ERROR]", error);
      toast.error(error.message || "Failed to update follow status");
    } finally {
      toast.dismiss(loadingToast);
      setIsUpdatingFollow(false);
    }
  };

  const isOwnProfile =
    currentUser?.username === user.username ||
    currentUser?.emailAddresses?.[0]?.emailAddress.split("@")[0] === user.username;

  // Parse the ISO string to get the formatted date
  const formattedDate = format(parseISO(user.createdAt), "MMMM yyyy");

  const renderSuspensionBanner = () => {
    if (!user.isActive && user.suspendedUntil && isOwnProfile) {
      const suspensionEnd = parseISO(user.suspendedUntil);
      return (
        <Card className="mb-4 bg-destructive/10 border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive font-semibold">Account Suspended</p>
            <p className="text-sm text-muted-foreground">
              Your account is suspended until {format(suspensionEnd, "PPp")}.
              During this period, you cannot create posts or comments.
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  const renderProfileActions = () => (
    <div className="flex gap-2">
      {!isOwnProfile && (
        <Button
          onClick={handleFollow}
          disabled={isUpdatingFollow}
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          className="h-9 px-4 gap-2"
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
      {isOwnProfile ? (
        <Button
          onClick={() => setShowEditDialog(true)}
          variant="outline"
          size="sm"
          className="h-9 px-4 gap-2"
        >
          <EditIcon className="h-4 w-4" />
          <span>Edit Profile</span>
        </Button>
      ) : (
        <ReportDialog type="PROFILE" targetId={user.id} />
      )}
    </div>
  );

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const userPosts = await getUserPosts(user.id);
        setUserPosts(userPosts);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [user.id]);

  return (
    <div className="container max-w-4xl py-6">
      <div className="grid gap-6">
        {renderSuspensionBanner()}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-2 border-muted-foreground/20">
                <AvatarImage src={user.image ?? "/avatar.png"} alt={user.name ?? user.username} />
              </Avatar>
              <div className="space-y-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {user.name ?? user.username}
                  </h1>
                  <UserBadges 
                    isVerified={user.verified ?? false} 
                    role={(user.role ?? "USER") as "USER" | "MODERATOR" | "ADMIN"} 
                  />
                </div>
                <p className="text-muted-foreground">@{user.username}</p>
                {user.bio && <p className="max-w-lg text-sm leading-normal">{user.bio}</p>}

                {/* User metadata moved to single location below */}
                {/* Profile Stats */}
                <div className="w-full mt-6 pt-6 border-t border-border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className="text-2xl font-bold tracking-tight">{user._count.following.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Following</div>
                    </div>
                    <div className="space-y-1 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className="text-2xl font-bold tracking-tight">{user._count.followers.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Followers</div>
                    </div>
                    <div className="space-y-1 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className="text-2xl font-bold tracking-tight">{user._count.posts.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Posts</div>
                    </div>
                  </div>
                </div>

                {/* Profile Actions */}
                <div className="w-full max-w-sm mx-auto mt-6">
                  <div className="flex gap-2 w-full">
                    {!currentUser ? (
                      <SignInButton mode="modal">
                        <Button 
                          className="w-full h-9"
                          size="sm"
                        >
                          Follow
                        </Button>
                      </SignInButton>
                    ) : isOwnProfile ? (
                      <Button 
                        className="w-full h-9" 
                        size="sm"
                        onClick={() => setShowEditDialog(true)}
                        variant="outline"
                      >
                        <EditIcon className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="flex-1 h-9"
                          size="sm"
                          onClick={handleFollow}
                          disabled={isUpdatingFollow}
                          variant={isFollowing ? "outline" : "default"}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                        <ReportDialog type="PROFILE" targetId={user.id} />
                      </>
                    )}
                  </div>
                </div>

                {/* This section has been moved up */}
                {/* User metadata (location, website, join date) */}
                <div className="w-full mt-6 space-y-2 text-sm">
                  {user.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPinIcon className="size-4 mr-2" />
                      {user.location}
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center text-muted-foreground">
                      <LinkIcon className="size-4 mr-2" />
                      <a
                        href={
                          user.website.startsWith("http") ? user.website : `https://${user.website}`
                        }
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="size-4 mr-2" />
                    Joined {formattedDate}
                  </div>
                </div>

                {/* Suspension Badge */}
                {user.suspendedUntil && (
                  <div className="mt-4 space-y-1">
                    <Badge variant="destructive" className="text-xs">
                      Account Suspended
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Suspended until: {format(new Date(user.suspendedUntil), 'PPP')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-12 p-0 bg-transparent">
            <TabsTrigger
              value="posts"
              className="relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                <span>Posts</span>
                <span className="ml-1 text-sm">({user._count.posts})</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <div className="flex items-center gap-2">
                <HeartIcon className="h-4 w-4" />
                <span>Likes</span>
                <span className="ml-1 text-sm">({user._count.posts})</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <div className="space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div key={post.id}>Post content</div>
                ))
              ) : isLoading ? (
                <div>Loading posts...</div>
              ) : (
                <Card className="p-6 text-center text-muted-foreground">
                  No posts yet
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="likes" className="mt-6">
            <div className="space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div key={post.id}>Post content</div>
                ))
              ) : (
                <Card className="p-8">
                  <div className="text-center space-y-2">
                    <HeartIcon className="h-8 w-8 mx-auto text-muted-foreground/60" />
                    <p className="text-lg font-medium">No liked posts</p>
                    <p className="text-sm text-muted-foreground">Posts you like will appear here.</p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your display name"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  className="min-h-[120px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Where are you based?"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                <Input
                  id="website"
                  name="website"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://your-website.com"
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm" className="h-9 px-4">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                onClick={handleEditSubmit} 
                size="sm" 
                className="h-9 px-4"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    
  );
}

export default ProfilePageClient;
