import RoleNavigation from "@/components/role/RoleNavigation";
import { checkRoleAuth } from "@/lib/role-middleware";
import { redirect } from "next/navigation";

export default async function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await checkRoleAuth(["MODERATOR", "ADMIN"]);

  if (!auth.isAuthorized) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <RoleNavigation currentRole="MODERATOR" />
      {children}
    </div>
  );
}