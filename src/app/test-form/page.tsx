"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAppSettings } from "@/actions/settings.action";
import { toast } from "react-hot-toast";

export default function TestFormPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    console.log('Form submitted with data:');
    
    for (const [name, value] of formData.entries()) {
      console.log(`${name}: ${value}`);
    }

    try {
      const updates = [
        {
          key: 'website_title',
          value: formData.get('website_title')?.toString() || 'Test Title',
          type: 'STRING',
          category: 'metadata',
          description: 'Test website title',
          isPublic: true
        }
      ];

      console.log('Sending updates:', updates);
      const result = await updateAppSettings(updates);
      console.log('Update result:', result);
      
      toast.success("Settings updated successfully!");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Test Form</h1>
      
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website_title">Website Title</Label>
          <Input 
            id="website_title"
            name="website_title"
            placeholder="Enter website title"
            defaultValue="Test Title"
          />
        </div>
        
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Settings"}
        </Button>
      </form>
    </div>
  );
}
