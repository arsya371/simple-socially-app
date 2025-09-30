import { checkRole } from "@/actions/auth.action";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthorized = await checkRole(["ADMIN", "MODERATOR"]);
  
  if (!isAuthorized) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden md:flex w-72 shrink-0">
          <AdminSidebar />
        </div>
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}