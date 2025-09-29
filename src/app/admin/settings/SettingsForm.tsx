"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { updateGeneralSettings, updateSecuritySettings, updateModerationSettings, updateApiSettings } from "@/app/api/admin/settings/actions";

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: Date;
  updatedBy: string;
}

interface SettingsFormProps {
  settings: Setting[];
}

export default function SettingsForm({ settings }: SettingsFormProps) {
  const getSetting = (key: string) => settings.find((s: Setting) => s.key === key)?.value || "";

  async function handleGeneralSubmit(formData: FormData) {
    const loadingToast = toast.loading("Updating general settings...");
    try {
      await updateGeneralSettings(formData);
      toast.success("General settings updated successfully!");
    } catch (error: any) {
      console.error("Error updating general settings:", error);
      toast.error(
        error.message || "Failed to update settings. Please try again later."
      );
    } finally {
      toast.dismiss(loadingToast);
    }
  }

  async function handleSecuritySubmit(formData: FormData) {
    try {
      const loadingToast = toast.loading("Updating security settings...");
      await updateSecuritySettings(formData);
      toast.dismiss(loadingToast);
      toast.success("Security settings updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    }
  }

  async function handleModerationSubmit(formData: FormData) {
    try {
      const loadingToast = toast.loading("Updating moderation settings...");
      await updateModerationSettings(formData);
      toast.dismiss(loadingToast);
      toast.success("Moderation settings updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    }
  }

  async function handleApiSubmit(formData: FormData) {
    try {
      const loadingToast = toast.loading("Updating API settings...");
      await updateApiSettings(formData);
      toast.dismiss(loadingToast);
      toast.success("API settings updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Site Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="p-6">
            <form action={handleGeneralSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name<span className="text-red-500">*</span></Label>
                  <Input 
                    id="site-name" 
                    name="site-name"
                    placeholder="Enter site name" 
                    defaultValue={getSetting("site-name")}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-description">Site Description</Label>
                  <Textarea 
                    id="site-description"
                    name="site-description" 
                    placeholder="Enter site description"
                    defaultValue={getSetting("site-description")}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input 
                    id="contact-email"
                    name="contact-email"
                    type="email"
                    placeholder="Enter contact email"
                    defaultValue={getSetting("contact-email")}
                  />
                </div>
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <form action={handleSecuritySubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allow-signups">Allow New Signups</Label>
                  <select 
                    id="allow-signups"
                    name="allow-signups"
                    className="w-full p-2 border rounded-md"
                    defaultValue={getSetting("allow-signups")}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-suspend">Auto-Suspend After Reports</Label>
                  <Input 
                    id="auto-suspend"
                    name="auto-suspend"
                    type="number"
                    min="0"
                    placeholder="Number of reports before auto-suspension"
                    defaultValue={getSetting("auto-suspend")}
                  />
                  <p className="text-sm text-muted-foreground">
                    Set to 0 to disable auto-suspension
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input 
                    id="max-login-attempts"
                    name="max-login-attempts"
                    type="number"
                    min="1"
                    placeholder="Maximum login attempts before lockout"
                    defaultValue={getSetting("max-login-attempts")}
                  />
                </div>
              </div>
              <Button type="submit">Update Security Settings</Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card className="p-6">
            <form action={handleModerationSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blocked-words">Blocked Words</Label>
                  <Textarea 
                    id="blocked-words"
                    name="blocked-words"
                    placeholder="Enter blocked words (one per line)"
                    defaultValue={getSetting("blocked-words")}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter one blocked word or phrase per line. Posts containing these words will be flagged for review.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="require-approval">Require Post Approval</Label>
                  <select 
                    id="require-approval"
                    name="require-approval"
                    className="w-full p-2 border rounded-md"
                    defaultValue={getSetting("require-approval")}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-threshold">Report Threshold</Label>
                  <Input 
                    id="report-threshold"
                    name="report-threshold"
                    type="number"
                    min="1"
                    placeholder="Number of reports before content is hidden"
                    defaultValue={getSetting("report-threshold")}
                  />
                </div>
              </div>
              <Button type="submit">Update Moderation Settings</Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card className="p-6">
            <form action={handleApiSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-enabled">Enable API Access</Label>
                  <select 
                    id="api-enabled"
                    name="api-enabled"
                    className="w-full p-2 border rounded-md"
                    defaultValue={getSetting("api-enabled")}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate-limit-requests">Rate Limit (Requests)</Label>
                  <Input 
                    id="rate-limit-requests"
                    name="rate-limit-requests"
                    type="number"
                    min="1"
                    placeholder="Maximum requests per window"
                    defaultValue={getSetting("rate-limit-requests")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate-limit-window">Rate Limit Window (Seconds)</Label>
                  <Input 
                    id="rate-limit-window"
                    name="rate-limit-window"
                    type="number"
                    min="1"
                    placeholder="Time window in seconds"
                    defaultValue={getSetting("rate-limit-window")}
                  />
                  <p className="text-sm text-muted-foreground">
                    Example: 100 requests per 60 seconds
                  </p>
                </div>
              </div>
              <Button type="submit">Update API Settings</Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}