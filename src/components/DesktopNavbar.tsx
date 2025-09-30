import { BellIcon, HomeIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import ModeToggle from "./ModeToggle";
import { canUsersChangeMode } from "@/lib/app-settings";
import { NotificationIndicator } from "./NotificationIndicator";
import { currentUser } from "@clerk/nextjs/server";

async function DesktopNavbar() {
  const user = await currentUser();
  const allowThemeToggle = await canUsersChangeMode();

  return (
    <div className="hidden md:flex items-center gap-2">
      <nav className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 px-3 hover:bg-muted/80 data-[active]:bg-muted" 
          asChild
        >
          <Link href="/">
            <HomeIcon className="h-4 w-4" />
            <span className="hidden lg:inline ml-2">Home</span>
          </Link>
        </Button>

        {user && (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 px-3 hover:bg-muted/80 data-[active]:bg-muted" 
              asChild
            >
              <Link href="/notifications" className="relative">
                <BellIcon className="h-4 w-4" />
                <NotificationIndicator />
                <span className="hidden lg:inline ml-2">Notifications</span>
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 px-3 hover:bg-muted/80 data-[active]:bg-muted" 
              asChild
            >
              <Link
                href={`/profile/${
                  user.username ?? user.emailAddresses[0].emailAddress.split("@")[0]
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden lg:inline ml-2">Profile</span>
              </Link>
            </Button>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2 ml-2 border-l pl-4">
        {allowThemeToggle && <ModeToggle />}
        {user ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <SignInButton mode="modal">
            <Button variant="default" size="sm" className="h-9 px-4">Sign In</Button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}
export default DesktopNavbar;