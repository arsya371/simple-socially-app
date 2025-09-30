import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";

export default async function DebugSettingsPage() {
  try {
    // Check if we can connect to the database
    const appSettings = await prisma.appSetting.findMany();
    const siteSettings = await prisma.siteSetting.findMany();
    
    return (
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Debug Settings</h1>
        
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">App Settings ({appSettings.length})</h2>
            <div className="space-y-2">
              {appSettings.map((setting) => (
                <div key={setting.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-mono text-sm">{setting.key}</span>
                  <span className="text-sm">{setting.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Site Settings ({siteSettings.length})</h2>
            <div className="space-y-2">
              {siteSettings.map((setting) => (
                <div key={setting.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-mono text-sm">{setting.key}</span>
                  <span className="text-sm">{setting.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Database Error</h1>
          <p className="text-red-500">{error.message}</p>
        </Card>
      </div>
    );
  }
}
