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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="hidden lg:block lg:col-span-3">
        <AdminSidebar />
      </div>
      <div className="lg:col-span-9">{children}</div>
    </div>
  );
}