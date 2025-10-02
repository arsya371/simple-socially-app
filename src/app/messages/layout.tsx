'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@clerk/nextjs';

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p>Please sign in to access messages</p>
        <Button className="mt-4" asChild>
          <a href="/sign-in">Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Card className="flex-1 p-4">
        {children}
      </Card>
    </div>
  );
}