import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicSettings } from "@/actions/settings.action";
import { getAppSetting } from "@/lib/app-settings";

export default async function TestSettingsPage() {
  const settings = await getPublicSettings();
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">App Settings Test Page</h1>
      
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Public Settings</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{key}</code>
                  <Badge variant="outline">Public</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Individual Settings Test</h2>
          <div className="space-y-4">
            <div>
              <strong>Website Title:</strong> {await getAppSetting('website_title', 'Not set')}
            </div>
            <div>
              <strong>Website Live:</strong> {await getAppSetting('website_live', false) ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Datetime Format:</strong> {await getAppSetting('datetime_format', 'Not set')}
            </div>
            <div>
              <strong>Distance Unit:</strong> {await getAppSetting('distance_unit', 'Not set')}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
