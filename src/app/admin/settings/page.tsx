import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { checkRole } from "@/actions/auth.action";
import SettingsForm from "./SettingsForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const dynamic = "force-dynamic";
import { RedirectType, redirect } from "next/navigation";

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: Date;
  updatedBy: string;
}

async function getSettings(): Promise<Setting[]> {
  const settings = await prisma.siteSetting.findMany({
    orderBy: {
      category: "asc"
    }
  });

  return settings.map((setting: any) => ({
    id: setting.id,
    key: setting.key,
    value: setting.value,
    category: setting.category,
    updatedAt: setting.updatedAt,
    updatedBy: setting.updatedBy
  }));
}

export default async function SettingsPage() {
  const isAdmin = await checkRole(["ADMIN"]);
  let settings: Setting[] = [];
  let error: string | null = null;

  if (!isAdmin) {
    redirect("/", RedirectType.replace);
  }

  try {
    settings = await getSettings();
  } catch (e: any) {
    error = e.message || "An unexpected error occurred";
    console.error("Error loading settings:", e);
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-6">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-center text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-center text-muted-foreground">
            {error}. Please contact an administrator if you believe this is a mistake.
          </p>
        </Card>
      </div>
    );
  }

  return <SettingsForm settings={settings} />;
}