"use client";

import { useEffect, useState } from "react";

export function VisitCounter() {
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
    <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
      <h3 className="text-lg font-semibold">Website Visits</h3>
      <p className="text-3xl font-bold">{visitCount}</p>
      <p className="text-sm opacity-80">Total page visits</p>
    </div>
  );
}
