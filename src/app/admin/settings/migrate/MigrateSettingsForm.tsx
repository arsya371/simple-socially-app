"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "react-hot-toast";
import { migrateSiteSettingsToAppSettings } from "@/actions/migrate-settings.action";
import { useRouter } from "next/navigation";

export default function MigrateSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMigration = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading("Migrating settings...");
    
    try {
      const result = await migrateSiteSettingsToAppSettings();
      
      toast.dismiss(loadingToast);
      toast.success(`Successfully migrated ${result.migrated} settings!`);
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (error: any) {
      console.error("Migration error:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to migrate settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Migration Process</h2>
        
        <Alert>
          <AlertDescription>
            This migration will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Copy all site settings to the new app settings system</li>
              <li>Automatically detect the correct data type for each setting</li>
              <li>Preserve all existing values and categories</li>
              <li>Keep the old site settings intact (for safety)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button 
            onClick={handleMigration}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2"
          >
            {isLoading ? "Migrating..." : "Start Migration"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
