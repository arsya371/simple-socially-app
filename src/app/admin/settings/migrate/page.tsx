import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkRole } from "@/actions/auth.action";
import { checkMigrationStatus, migrateSiteSettingsToAppSettings } from "@/actions/migrate-settings.action";
import { RedirectType, redirect } from "next/navigation";
import MigrateSettingsForm from "./MigrateSettingsForm";

export const dynamic = "force-dynamic";

export default async function MigrateSettingsPage() {
  const isAdmin = await checkRole(["ADMIN"]);
  
  if (!isAdmin) {
    redirect("/", RedirectType.replace);
  }

  const migrationStatus = await checkMigrationStatus();

  return (
    <div className="container max-w-4xl py-6">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Settings Migration
          </h1>
          <p className="text-muted-foreground text-lg">
            Migrate site settings to the new app settings system
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Migration Status</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Site Settings (Old)</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {migrationStatus.siteSettingsCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  Settings in the old system
                </p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium">App Settings (New)</h3>
                <p className="text-2xl font-bold text-green-600">
                  {migrationStatus.appSettingsCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  Settings in the new system
                </p>
              </div>
            </div>

            {migrationStatus.needsMigration ? (
              <Alert>
                <AlertDescription>
                  You have {migrationStatus.siteSettingsCount} site settings that need to be migrated to the new app settings system. 
                  This will preserve all your existing configuration while moving to the improved system.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  All settings have been successfully migrated! You can now use the new app settings system.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {migrationStatus.needsMigration && (
          <MigrateSettingsForm />
        )}
      </div>
    </div>
  );
}
