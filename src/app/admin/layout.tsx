import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getUserByClerkId } from "@/actions/user.action";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await getUserByClerkId(user.id);
  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto py-6 px-4">
          {children}
        </div>
      </div>
    </div>
  );
}