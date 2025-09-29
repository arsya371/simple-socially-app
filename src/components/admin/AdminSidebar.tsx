"use client";

import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  Flag,
  Home
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { checkRole } from "@/actions/auth.action";
import { useEffect, useState } from "react";

type AdminLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("ADMIN" | "MODERATOR" | "USER")[];
};

const adminLinks: AdminLink[] = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, roles: ["ADMIN", "MODERATOR"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/posts", label: "Posts", icon: FileText, roles: ["ADMIN", "MODERATOR"] },
  { href: "/admin/reports", label: "Reports", icon: Flag, roles: ["ADMIN", "MODERATOR"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
  { href: "/", label: "Back to Home", icon: Home, roles: ["ADMIN", "MODERATOR"] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<"ADMIN" | "MODERATOR" | "USER" | null>(null);

  useEffect(() => {
    // Check user role on component mount
    async function checkUserRole() {
      const isAdmin = await checkRole(["ADMIN"]);
      const isModerator = !isAdmin && await checkRole(["MODERATOR"]);
      setUserRole(isAdmin ? "ADMIN" : isModerator ? "MODERATOR" : "USER");
    }
    checkUserRole();
  }, []);

  // Filter links based on user role
  const visibleLinks = adminLinks.filter(link => 
    userRole && link.roles.includes(userRole)
  );

  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">
          {userRole === "ADMIN" ? "Admin Dashboard" : "Moderator Dashboard"}
        </h2>
        <div className="space-y-1">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                pathname === link.href 
                  ? "bg-accent text-primary" 
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}