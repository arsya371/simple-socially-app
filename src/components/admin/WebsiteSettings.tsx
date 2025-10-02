"use client"
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

type Settings = {
  [key: string]: string;
};

export default function WebsiteSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch settings");
        }

        // Convert array of settings to object
        const settingsObj = data.settings.reduce((acc: Settings, setting: any) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});
        
        setSettings(settingsObj);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: settingsArray }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      // Revalidate the home page and layout
      await Promise.all([
        fetch('/api/revalidate?path=/', { method: 'GET' }),
        fetch('/api/revalidate?path=/layout', { method: 'GET' })
      ]);

      toast({
        title: "Success",
        description: "Settings updated successfully. Changes will be reflected across the site.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultSettings = {
    siteName: '',
    siteDescription: '',
    metaKeywords: '',
    metaDescription: '',
    contactEmail: '',
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            Configure your website&apos;s search engine optimization settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="siteTitle">Website Title</Label>
              <Input
                id="siteTitle"
                placeholder="Enter website title"
                value={settings.siteTitle || ""}
                onChange={(e) => handleInputChange("siteTitle", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                placeholder="Enter meta description"
                value={settings.metaDescription || ""}
                onChange={(e) => handleInputChange("metaDescription", e.target.value)}
                className="h-20"
              />
            </div>
            <div>
              <Label htmlFor="metaKeywords">Meta Keywords</Label>
              <Input
                id="metaKeywords"
                placeholder="Enter meta keywords"
                value={settings.metaKeywords || ""}
                onChange={(e) => handleInputChange("metaKeywords", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure general website settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                placeholder="Enter site name"
                value={settings.siteName || ""}
                onChange={(e) => handleInputChange("siteName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="Enter contact email"
                value={settings.contactEmail || ""}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving Changes..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
    <Toaster />
    </>
  );
}