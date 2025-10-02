"use client";

import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  MessageSquareIcon,
  ShieldIcon,
  WrenchIcon,
  TerminalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function MobileNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  const isAdmin = user?.publicMetadata?.role === "ADMIN";
  const isModerator = user?.publicMetadata?.role === "MODERATOR";
  const isDeveloper = user?.publicMetadata?.role === "DEVELOPER";

  return (
    <div className="flex md:hidden items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="mr-2"
      >
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-6">
            <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
              <Link href="/">
                <HomeIcon className="w-4 h-4" />
                <span>Home</span>
              </Link>
            </Button>

            {isSignedIn ? (
              <>
                <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
                  <Link href="/notifications">
                    <BellIcon className="w-4 h-4" />
                    <span>Notifications</span>
                  </Link>
                </Button>

                <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
                  <Link href="/messages">
                    <MessageSquareIcon className="w-4 h-4" />
                    <span>Messages</span>
                  </Link>
                </Button>

                {isAdmin && (
                  <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
                    <Link href="/admin">
                      <ShieldIcon className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                  </Button>
                )}

                {isModerator && (
                  <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
                    <Link href="/moderator">
                      <WrenchIcon className="w-4 h-4" />
                      <span>Moderator</span>
                    </Link>
                  </Button>
                )}

                {isDeveloper && (
                  <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
                    <Link href="/developer">
                      <TerminalIcon className="w-4 h-4" />
                      <span>Developer</span>
                    </Link>
                  </Button>
                )}

                <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
                  <Link href={`/profile/${user?.username ?? user?.emailAddresses[0]?.emailAddress.split("@")[0]}`}>
                    <UserIcon className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                </Button>

                <SignOutButton>
                  <Button variant="ghost" className="flex items-center gap-3 justify-start w-full">
                    <LogOutIcon className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </SignOutButton>
              </>
            ) : (
              <SignInButton mode="modal">
                <Button className="w-full">Sign In</Button>
              </SignInButton>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}