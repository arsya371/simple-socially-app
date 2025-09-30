"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

export function WebsiteVisitsCard() {
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    // Get current visit count from localStorage
    const currentCount = localStorage.getItem('websiteVisits');
    const count = currentCount ? parseInt(currentCount) : 0;
    
    // Increment the count
    const newCount = count + 1;
    setVisitCount(newCount);
    
    // Save back to localStorage
    localStorage.setItem('websiteVisits', newCount.toString());
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-700">
      <h3 className="text-lg font-semibold mb-2 text-cyan-700 dark:text-cyan-300">Website Visits</h3>
      <p className="text-4xl font-bold text-cyan-900 dark:text-cyan-100">{visitCount}</p>
    </Card>
  );
}
