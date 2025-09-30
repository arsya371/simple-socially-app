"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAppSetting } from "@/lib/app-settings";

interface WebsiteLiveCheckProps {
  children: React.ReactNode;
}

export default function WebsiteLiveCheck({ children }: WebsiteLiveCheckProps) {
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [shutdownMessage, setShutdownMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkWebsiteStatus() {
      try {
        const [live, message] = await Promise.all([
          getAppSetting('website_live', true),
          getAppSetting('shutdown_message', 'Come back soon')
        ]);
        
        setIsLive(live);
        setShutdownMessage(message);
      } catch (error) {
        console.error('Error checking website status:', error);
        // Default to live if there's an error
        setIsLive(true);
      } finally {
        setLoading(false);
      }
    }

    checkWebsiteStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-4">
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Website Temporarily Unavailable
              </h1>
              
              <Alert>
                <AlertDescription className="text-center">
                  {shutdownMessage}
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We're working to get things back up and running. Please check back later.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
