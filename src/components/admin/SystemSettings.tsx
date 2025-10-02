"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import ImageUpload from "@/components/ImageUpload";
import Image from "next/image";

type Setting = {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
};

type SettingDefinition = {
  key: string;
  label: string;
  description: string;
  type: 'boolean' | 'text' | 'number' | 'image';
};

const defaultSettings: SettingDefinition[] = [
  {
    key: "maintenanceMode",
    label: "Maintenance Mode",
    description: "Enable/disable site maintenance mode",
    type: "boolean",
  },
  {
    key: "siteName",
    label: "Site Name",
    description: "The name of your website",
    type: "text",
  },
  {
    key: "siteDescription",
    label: "Site Description",
    description: "A brief description of your website",
    type: "text",
  },
  {
    key: "siteLogo",
    label: "Site Logo",
    description: "The logo displayed in the navigation bar (recommended size: 32x32)",
    type: "image",
  },
  {
    key: "siteFavicon",
    label: "Site Favicon",
    description: "The icon shown in browser tabs (must be .ico format)",
    type: "image",
  },
  {
    key: "maxUploadSize",
    label: "Max Upload Size (MB)",
    description: "Maximum file upload size in megabytes",
    type: "number",
  },
  {
    key: "userRegistration",
    label: "User Registration",
    description: "Allow new user registrations",
    type: "boolean",
  },
  {
    key: "metaKeywords",
    label: "Meta Keywords",
    description: "Keywords for search engine optimization (comma-separated)",
    type: "text",
  },
  {
    key: "metaDescription",
    label: "Meta Description",
    description: "Description for search engine results",
    type: "text",
  }
];

export default function SystemSettings() {
  const [settings, setSettings] = useState<Array<Setting>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<{ [key: string]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch only the settings we need
      const settingsToFetch = defaultSettings.map(s => s.key);
      const queryString = new URLSearchParams({ keys: settingsToFetch.join(',') }).toString();
      const response = await fetch(`/api/admin/settings?${queryString}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch settings");
      }

      // Initialize settings that don't exist yet with default values
      const initializedSettings = settingsToFetch.map(key => {
        const existing = data.settings?.find((s: Setting) => s.key === key);
        if (existing) return existing;
        
        const defaultSetting = defaultSettings.find(s => s.key === key);
        return {
          id: key,
          key,
          value: defaultSetting?.type === 'boolean' ? 'false' : '',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      });

      setSettings(initializedSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    // Initialize local settings from fetched settings
    const initialLocalSettings = settings.reduce((acc: { [key: string]: string }, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    setLocalSettings(initialLocalSettings);
  }, [settings]);

  const updateSetting = async (key: string, value: string) => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update setting");
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      const updates = Object.entries(localSettings).map(([key, value]) => {
        const currentSetting = settings.find(s => s.key === key);
        if (currentSetting?.value !== value) {
          return updateSetting(key, value);
        }
      }).filter(Boolean);

      await Promise.all(updates);

      toast({
        title: "Success",
        description: "All settings saved successfully.",
      });

      setHasChanges(false);
      await fetchSettings(); // Refresh settings after all updates
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save some settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-b">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setLocalSettings({});
                  setHasChanges(false);
                  fetchSettings();
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={saveChanges}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {defaultSettings.map((setting) => {
        const currentSetting = settings?.find((s: Setting) => s.key === setting.key);
        const currentValue = currentSetting?.value || "";

        return (
          <Card key={setting.key} className="p-4">
            <div className="space-y-2">
              <Label htmlFor={setting.key}>{setting.label}</Label>
              <p className="text-sm text-muted-foreground">
                {setting.description}
              </p>
              <div className="flex gap-4 items-center">
                {setting.type === "boolean" ? (
                  <div className="flex items-center space-x-2">
                    <select
                      id={setting.key}
                      value={localSettings[setting.key] ?? currentValue}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="border rounded p-2"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                ) : setting.type === "image" ? (
                  <div className="space-y-4">
                    {currentValue && (
                      <div className="relative w-32 h-32">
                        <Image
                          src={currentValue}
                          alt={setting.label}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <ImageUpload
                      value={currentValue}
                      onChange={(url) => updateSetting(setting.key, url)}
                      endpoint="postImage"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      id={setting.key}
                      type={setting.type === "number" ? "number" : "text"}
                      value={localSettings[setting.key] ?? currentValue}
                      onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    updateSetting(
                      setting.key,
                      setting.type === "boolean" ? "false" : ""
                    )
                  }
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}