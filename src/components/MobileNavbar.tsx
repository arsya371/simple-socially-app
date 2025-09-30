"use client";

import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";
import { NotificationIndicator } from "./NotificationIndicator";

function MobileNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isSignedIn } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex md:hidden items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-9 w-9 mr-2"
      >
        <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MenuIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-[300px]">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-2 mt-6">
            <Button variant="ghost" size="sm" className="justify-start h-9 px-3" asChild>
              <Link href="/" onClick={() => setShowMobileMenu(false)}>
                <HomeIcon className="w-4 h-4 mr-3" />
                Home
              </Link>
            </Button>

            {isSignedIn ? (
              <>
                <Button variant="ghost" size="sm" className="justify-start h-9 px-3" asChild>
                  <Link href="/notifications" onClick={() => setShowMobileMenu(false)} className="relative">
                    <div className="flex items-center">
                      <div className="relative">
                        <BellIcon className="w-4 h-4 mr-3" />
                        <NotificationIndicator />
                      </div>
                      <span>Notifications</span>
                    </div>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start h-9 px-3" asChild>
                  <Link href="/profile" onClick={() => setShowMobileMenu(false)}>
                    <UserIcon className="w-4 h-4 mr-3" />
                    Profile
                  </Link>
                </Button>
                <SignOutButton>
                  <Button variant="ghost" size="sm" className="justify-start w-full h-9 px-3">
                    <LogOutIcon className="w-4 h-4 mr-3" />
                    Logout
                  </Button>
                </SignOutButton>
              </>
            ) : (
              <SignInButton mode="modal">
                <Button variant="default" size="sm" className="w-full h-9">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavbar;