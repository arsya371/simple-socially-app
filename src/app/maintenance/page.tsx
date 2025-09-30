import { Card } from "@/components/ui/card";
import { getAppSetting } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const message = await getAppSetting('shutdown_message', 'Come back soon');

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Website Under Maintenance</h1>
            <p className="text-muted-foreground">{message}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}


