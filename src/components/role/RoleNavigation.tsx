"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  label: string;
  roles: string[];
};

const navigationItems: NavigationItem[] = [
  {
    href: "/moderator",
    label: "Dashboard",
    roles: ["MODERATOR", "ADMIN"],
  },
  {
    href: "/moderator/reports",
    label: "Reports",
    roles: ["MODERATOR", "ADMIN"],
  },
  {
    href: "/moderator/content",
    label: "Content",
    roles: ["MODERATOR", "ADMIN"],
  },
  {
    href: "/developer",
    label: "Developer Tools",
    roles: ["DEVELOPER", "ADMIN"],
  },
  {
    href: "/developer/logs",
    label: "System Logs",
    roles: ["DEVELOPER", "ADMIN"],
  },
  {
    href: "/developer/api",
    label: "API Management",
    roles: ["DEVELOPER", "ADMIN"],
  },
  {
    href: "/admin",
    label: "Admin Panel",
    roles: ["ADMIN"],
  },
  {
    href: "/admin/users",
    label: "User Management",
    roles: ["ADMIN"],
  },
  {
    href: "/admin/settings",
    label: "Site Settings",
    roles: ["ADMIN"],
  },
];

export default function RoleNavigation({ currentRole }: { currentRole: string }) {
  const pathname = usePathname();
  const items = navigationItems.filter((item) => item.roles.includes(currentRole));

  return (
    <nav className="flex gap-2 pb-4 border-b">
      {items.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "default" : "ghost"}
          asChild
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  );
}