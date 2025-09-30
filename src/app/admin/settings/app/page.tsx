import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { checkRole } from "@/actions/auth.action";
import { initializeDefaultAppSettings } from "@/actions/settings.action";
import AppSettingsForm from "./AppSettingsForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RedirectType, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface AppSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: Date;
  editor: {
    username: string;
  };
}

async function getAppSettings(): Promise<AppSetting[]> {
  const settings = await prisma.appSetting.findMany({
    orderBy: {
      category: "asc"
    },
    include: {
      editor: {
        select: {
          username: true
        }
      }
    }
  });

  return settings;
}

export default async function AppSettingsPage() {
  const isAdmin = await checkRole(["ADMIN"]);
  let settings: AppSetting[] = [];
  let error: string | null = null;

  if (!isAdmin) {
    redirect("/", RedirectType.replace);
  }

  try {
    settings = await getAppSettings();
    
    // Initialize default settings if none exist
    if (settings.length === 0) {
      await initializeDefaultAppSettings();
      settings = await getAppSettings();
    }
  } catch (e: any) {
    error = e.message || "An unexpected error occurred";
    console.error("Error loading app settings:", e);
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

  return <AppSettingsForm settings={settings} />;
}
