import Link from "next/link";
import { Home, Users, Settings, Layout } from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home
  },
  {
    title: "Website",
    href: "/",
    icon: Layout
  }
];

export default function AdminSidebar() {
  return (
    <div className="w-64 h-full border-r bg-background">
      <div className="p-6">
        <h2 className="text-xl font-semibold">Admin Panel</h2>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-6 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}