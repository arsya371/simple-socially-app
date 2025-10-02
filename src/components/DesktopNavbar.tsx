"use client";

import { BellIcon, HomeIcon, UserIcon, MessageSquareIcon, ShieldIcon, WrenchIcon, TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import ModeToggle from "./ModeToggle";

export default function DesktopNavbar() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "ADMIN";
  const isModerator = user?.publicMetadata?.role === "MODERATOR";
  const isDeveloper = user?.publicMetadata?.role === "DEVELOPER";

  return (
    <div className="hidden md:flex items-center space-x-4">
      <ModeToggle />

      <Button variant="ghost" className="flex items-center gap-2" asChild>
        <Link href="/">
          <HomeIcon className="w-4 h-4" />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>

      {user ? (
        <>
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link href="/notifications">
              <BellIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Notifications</span>
            </Link>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link href="/messages">
              <MessageSquareIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Messages</span>
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/admin">
                <ShieldIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            </Button>
          )}
          {isModerator && (
            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/moderator">
                <WrenchIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Moderator</span>
              </Link>
            </Button>
          )}
          {isDeveloper && (
            <Button variant="ghost" className="flex items-center gap-2" asChild>
              <Link href="/developer">
                <TerminalIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Developer</span>
              </Link>
            </Button>
          )}
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link
              href={`/profile/${
                user.username ?? user.emailAddresses[0].emailAddress.split("@")[0]
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Profile</span>
            </Link>
          </Button>
          <UserButton />
        </>
      ) : (
        <SignInButton mode="modal">
          <Button variant="default">Sign In</Button>
        </SignInButton>
      )}
    </div>
  );
}
