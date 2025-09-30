"use client";

import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  Flag,
  Home,
  Cog
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
  { href: "/admin/settings/app", label: "App Settings", icon: Cog, roles: ["ADMIN"] },
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
    <div className="h-screen bg-card border-r border-border shadow-sm">
      <div className="px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-card-foreground mb-2">
            {userRole === "ADMIN" ? "Admin Dashboard" : "Moderator Dashboard"}
          </h2>
          <div className="h-1 w-16 bg-primary rounded-full"></div>
        </div>
        
        <div className="space-y-2">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group",
                pathname === link.href 
                  ? "bg-primary text-primary-foreground border-l-4 border-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className={cn(
                "h-5 w-5 transition-colors",
                pathname === link.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
              )} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}