"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { updateAppSettings } from "@/actions/settings.action";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { Globe, Home, Star, Share2, Camera } from "lucide-react";

interface AppSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: Date;
  editor: {
    username: string;
  };
}

interface AppSettingsFormProps {
  settings: AppSetting[];
}

export default function AppSettingsForm({ settings }: AppSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  
  const getSetting = (key: string, defaultValue: string = "") => {
    const setting = settings.find((s: AppSetting) => s.key === key);
    return setting?.value || defaultValue;
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const loadingToast = toast.loading("Updating app settings...");
    
    try {
      const updates: Array<{
        key: string;
        value: string;
        type: string;
        category: string;
        description?: string;
        isPublic?: boolean;
      }> = [];

      // Define all possible settings with their types and categories
      const settingDefinitions = {
        'website_live': { type: 'BOOLEAN', category: 'website', description: 'Turn the entire website On and Off', isPublic: false },
        'shutdown_message': { type: 'STRING', category: 'website', description: 'The text that is presented when the site is closed', isPublic: false },
        'system_email': { type: 'STRING', category: 'website', description: 'The contact email that all messages send to', isPublic: false },
        'site-name': { type: 'STRING', category: 'metadata', description: 'Site name displayed in header and sidebar', isPublic: true },
        'website_title': { type: 'STRING', category: 'metadata', description: 'Title of your website for SEO', isPublic: true },
        'website_description': { type: 'STRING', category: 'metadata', description: 'Description of your website', isPublic: true },
        'site-description': { type: 'STRING', category: 'metadata', description: 'Site description for metadata', isPublic: true },
        'website_keywords': { type: 'STRING', category: 'metadata', description: 'Keywords for SEO', isPublic: true },
        'logo_light': { type: 'IMAGE', category: 'visual', description: 'Logo for light mode', isPublic: true },
        'logo_dark': { type: 'IMAGE', category: 'visual', description: 'Logo for dark mode', isPublic: true },
        'default_wallpaper': { type: 'BOOLEAN', category: 'visual', description: 'Use the default wallpaper', isPublic: false },
        'custom_wallpaper': { type: 'IMAGE', category: 'visual', description: 'Custom wallpaper image', isPublic: true },
        'landing_page_layout': { type: 'STRING', category: 'visual', description: 'Landing page layout theme', isPublic: false },
        'default_favicon': { type: 'BOOLEAN', category: 'visual', description: 'Use the default favicon', isPublic: false },
        'custom_favicon': { type: 'IMAGE', category: 'visual', description: 'Custom favicon image', isPublic: true },
        'default_og_image': { type: 'BOOLEAN', category: 'visual', description: 'Use the default OG image', isPublic: false },
        'custom_og_image': { type: 'IMAGE', category: 'visual', description: 'Custom Open Graph image', isPublic: true },
        'datetime_format': { type: 'STRING', category: 'system', description: 'System datetime format', isPublic: false },
        'distance_unit': { type: 'STRING', category: 'system', description: 'System distance unit', isPublic: false },
        'website_public': { type: 'BOOLEAN', category: 'advanced', description: 'Make the website public to allow non logged users to view website content', isPublic: true },
        'newsfeed_public': { type: 'BOOLEAN', category: 'advanced', description: 'Make newsfeed public to allow non logged users to view posts', isPublic: true },
        'directory_enabled': { type: 'BOOLEAN', category: 'advanced', description: 'Enable user directory for public browsing', isPublic: true },
        'night_mode_default': { type: 'BOOLEAN', category: 'advanced', description: 'Default to night mode for new users', isPublic: true },
        'users_can_change_mode': { type: 'BOOLEAN', category: 'advanced', description: 'Allow users to change theme mode', isPublic: true },
      };

      // Process all form fields
      for (const [name, value] of formData.entries()) {
        if (name.startsWith('setting_')) {
          const key = name.replace('setting_', '');
          const definition = settingDefinitions[key as keyof typeof settingDefinitions];
          
          if (definition) {
            updates.push({
              key,
              value: value.toString(),
              type: definition.type,
              category: definition.category,
              description: definition.description,
              isPublic: definition.isPublic
            });
            
            // Special handling: when website_title changes, also update site-name
            if (key === 'website_title') {
              updates.push({
                key: 'site-name',
                value: value.toString(),
                type: 'STRING',
                category: 'metadata',
                description: 'Site name displayed in header and sidebar',
                isPublic: true
              });
            }
            
            // Also sync website_description with site-description
            if (key === 'website_description') {
              updates.push({
                key: 'site-description',
                value: value.toString(),
                type: 'STRING',
                category: 'metadata',
                description: 'Site description for metadata',
                isPublic: true
              });
            }
          }
        }
      }

      await updateAppSettings(updates);
      toast.dismiss(loadingToast);
      toast.success("App settings updated successfully!");
      
      // Reload the page to reflect changes in header/sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Error updating app settings:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to update app settings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          App Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Configure application-wide settings and preferences
        </p>
      </div>

      <form action={handleSubmit} className="space-y-8">
        <Tabs defaultValue="website" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="website" className="text-sm font-medium">Website</TabsTrigger>
            <TabsTrigger value="visual" className="text-sm font-medium">Visual</TabsTrigger>
            <TabsTrigger value="system" className="text-sm font-medium">System</TabsTrigger>
            <TabsTrigger value="advanced" className="text-sm font-medium">Advanced</TabsTrigger>
          </TabsList>

          {/* Website Settings Tab */}
          <TabsContent value="website" className="space-y-6">
            {/* Website Live Settings */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Website Live Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <Label className="text-base font-semibold">Website Live</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Turn the entire website On and Off</p>
                  </div>
                  <Switch
                    name="setting_website_live"
                    defaultChecked={getSetting("website_live") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_website_live"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_website_live" value={getSetting("website_live", "true")} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Shutdown Message</Label>
                  <Textarea
                    name="setting_shutdown_message"
                    defaultValue={getSetting("shutdown_message", "Come back soon")}
                    placeholder="The text that is presented when the site is closed"
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Email</Label>
                  <Input
                    name="setting_system_email"
                    type="email"
                    defaultValue={getSetting("system_email", "admin@example.com")}
                    placeholder="The contact email that all messages send to"
                  />
                </div>
              </div>
            </Card>

            {/* Website Metadata */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Website Metadata</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Site Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="setting_website_title"
                    defaultValue={getSetting("website_title") || getSetting("site-name", "Socially App")}
                    placeholder="Enter site name (will update header and sidebar)"
                    required
                    minLength={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    This name will be displayed in the header, sidebar, and browser title
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Website Description</Label>
                  <Textarea
                    name="setting_website_description"
                    defaultValue={getSetting("website_description") || getSetting("site-description", "Share your memories, connect with others, make new friends")}
                    placeholder="Description of your website"
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Website Keywords</Label>
                  <Textarea
                    name="setting_website_keywords"
                    defaultValue={getSetting("website_keywords", "social network, social platform, connect, friends")}
                    placeholder="Example: social, social site"
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Visual Settings Tab */}
          <TabsContent value="visual" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Visual Customization</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <ImageUploadField
                  label="Logo (Light Mode)"
                  name="logo_light"
                  icon={Camera}
                  currentValue={getSetting("logo_light")}
                />
                <ImageUploadField
                  label="Logo (Dark Mode)"
                  name="logo_dark"
                  icon={Camera}
                  currentValue={getSetting("logo_dark")}
                />
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Home className="h-5 w-5 text-purple-600" />
                      <Label className="text-base font-semibold">Default Wallpaper</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use the default (preview) (Disable it to use your custom uploaded image)
                    </p>
                  </div>
                  <Switch
                    name="setting_default_wallpaper"
                    defaultChecked={getSetting("default_wallpaper") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_default_wallpaper"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_default_wallpaper" value={getSetting("default_wallpaper", "true")} />
                </div>

                <ImageUploadField
                  label="Custom Wallpaper"
                  name="custom_wallpaper"
                  icon={Camera}
                  currentValue={getSetting("custom_wallpaper")}
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Landing Page Layout</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="default" 
                        name="setting_landing_page_layout" 
                        value="default"
                        defaultChecked={getSetting("landing_page_layout", "elengine") === "default"}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="default">Default</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="elengine" 
                        name="setting_landing_page_layout" 
                        value="elengine"
                        defaultChecked={getSetting("landing_page_layout", "elengine") === "elengine"}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="elengine">Elengine (preview)</Label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can get the whole Elengine theme from{" "}
                    <a href="#" className="text-blue-600 hover:underline">Here</a>
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <Label className="text-base font-semibold">Default Favicon</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use the default (preview) (Disable it to use your custom uploaded image)
                    </p>
                  </div>
                  <Switch
                    name="setting_default_favicon"
                    defaultChecked={getSetting("default_favicon") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_default_favicon"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_default_favicon" value={getSetting("default_favicon", "true")} />
                </div>

                <ImageUploadField
                  label="Custom Favicon"
                  name="custom_favicon"
                  icon={Camera}
                  currentValue={getSetting("custom_favicon")}
                />
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Share2 className="h-5 w-5 text-green-600" />
                      <Label className="text-base font-semibold">Default OG-Image</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use the default (preview) (Disable it to use your custom uploaded image)
                    </p>
                  </div>
                  <Switch
                    name="setting_default_og_image"
                    defaultChecked={getSetting("default_og_image") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_default_og_image"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_default_og_image" value={getSetting("default_og_image", "true")} />
                </div>

                <ImageUploadField
                  label="Custom OG-Image"
                  name="custom_og_image"
                  icon={Camera}
                  description="The perfect size for your og-image should be (width: 590px & height: 300px)"
                  currentValue={getSetting("custom_og_image")}
                />
              </div>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">System Settings</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Datetime Format</Label>
                  <Select name="setting_datetime_format" defaultValue={getSetting("datetime_format", "d/m/Y H:i")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select datetime format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="d/m/Y H:i">d/m/Y H:i (Example: 30/05/2023 01:30 PM)</SelectItem>
                      <SelectItem value="m/d/Y H:i">m/d/Y H:i (Example: 05/30/2023 01:30 PM)</SelectItem>
                      <SelectItem value="Y-m-d H:i">Y-m-d H:i (Example: 2023-05-30 13:30)</SelectItem>
                      <SelectItem value="d-m-Y H:i">d-m-Y H:i (Example: 30-05-2023 13:30)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Select the datetime format of the datetime picker</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Distance Unit</Label>
                  <Select name="setting_distance_unit" defaultValue={getSetting("distance_unit", "kilometer")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select distance unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kilometer">Kilometer</SelectItem>
                      <SelectItem value="mile">Mile</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Select the distance measure unit of your website</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Advanced Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Website Public</Label>
                    <p className="text-sm text-muted-foreground">Make the website public to allow non logged users to view website content</p>
                  </div>
                  <Switch
                    name="setting_website_public"
                    defaultChecked={getSetting("website_public") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_website_public"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_website_public" value={getSetting("website_public", "false")} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Newsfeed Public</Label>
                    <p className="text-sm text-muted-foreground">Make newsfeed public to allow non logged users to view posts</p>
                  </div>
                  <Switch
                    name="setting_newsfeed_public"
                    defaultChecked={getSetting("newsfeed_public") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_newsfeed_public"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_newsfeed_public" value={getSetting("newsfeed_public", "false")} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Directory Enabled</Label>
                    <p className="text-sm text-muted-foreground">Enable user directory for public browsing</p>
                  </div>
                  <Switch
                    name="setting_directory_enabled"
                    defaultChecked={getSetting("directory_enabled") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_directory_enabled"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_directory_enabled" value={getSetting("directory_enabled", "true")} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Night Mode Default</Label>
                    <p className="text-sm text-muted-foreground">Default to night mode for new users</p>
                  </div>
                  <Switch
                    name="setting_night_mode_default"
                    defaultChecked={getSetting("night_mode_default") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_night_mode_default"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_night_mode_default" value={getSetting("night_mode_default", "false")} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Users Can Change Mode</Label>
                    <p className="text-sm text-muted-foreground">Allow users to change theme mode</p>
                  </div>
                  <Switch
                    name="setting_users_can_change_mode"
                    defaultChecked={getSetting("users_can_change_mode") === "true"}
                    onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="setting_users_can_change_mode"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked.toString();
                    }}
                  />
                  <input type="hidden" name="setting_users_can_change_mode" value={getSetting("users_can_change_mode", "true")} />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-lg font-medium"
          >
            {loading ? "Updating..." : "Save All Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}


// "use client";

// import { useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "react-hot-toast";
// import { updateAppSettings } from "@/actions/settings.action";
// import ImageUploadField from "@/components/admin/ImageUploadField";
// import { Globe, Home, Star, Share2, Camera } from "lucide-react";

// interface AppSetting {
//   id: string;
//   key: string;
//   value: string;
//   type: string;
//   category: string;
//   description: string | null;
//   isPublic: boolean;
//   updatedAt: Date;
//   editor: {
//     username: string;
//   };
// }

// interface AppSettingsFormProps {
//   settings: AppSetting[];
// }

// export default function AppSettingsForm({ settings }: AppSettingsFormProps) {
//   const [loading, setLoading] = useState(false);
  
//   const getSetting = (key: string, defaultValue: string = "") => {
//     const setting = settings.find((s: AppSetting) => s.key === key);
//     return setting?.value || defaultValue;
//   };

//   const handleSubmit = async (formData: FormData) => {
//     setLoading(true);
//     const loadingToast = toast.loading("Updating app settings...");
    
//     try {
//       const updates: Array<{
//         key: string;
//         value: string;
//         type: string;
//         category: string;
//         description?: string;
//         isPublic?: boolean;
//       }> = [];

//       // Define all possible settings with their types and categories
//       const settingDefinitions = {
//         'website_live': { type: 'BOOLEAN', category: 'website', description: 'Turn the entire website On and Off', isPublic: false },
//         'shutdown_message': { type: 'STRING', category: 'website', description: 'The text that is presented when the site is closed', isPublic: false },
//         'system_email': { type: 'STRING', category: 'website', description: 'The contact email that all messages send to', isPublic: false },
//         'site-name': { type: 'STRING', category: 'metadata', description: 'Site name displayed in header and sidebar', isPublic: true },
//         'website_title': { type: 'STRING', category: 'metadata', description: 'Title of your website for SEO', isPublic: true },
//         'website_description': { type: 'STRING', category: 'metadata', description: 'Description of your website', isPublic: true },
//         'site-description': { type: 'STRING', category: 'metadata', description: 'Site description for metadata', isPublic: true },
//         'website_keywords': { type: 'STRING', category: 'metadata', description: 'Keywords for SEO', isPublic: true },
//         'logo_light': { type: 'IMAGE', category: 'visual', description: 'Logo for light mode', isPublic: true },
//         'logo_dark': { type: 'IMAGE', category: 'visual', description: 'Logo for dark mode', isPublic: true },
//         'default_wallpaper': { type: 'BOOLEAN', category: 'visual', description: 'Use the default wallpaper', isPublic: false },
//         'custom_wallpaper': { type: 'IMAGE', category: 'visual', description: 'Custom wallpaper image', isPublic: true },
//         'landing_page_layout': { type: 'STRING', category: 'visual', description: 'Landing page layout theme', isPublic: false },
//         'default_favicon': { type: 'BOOLEAN', category: 'visual', description: 'Use the default favicon', isPublic: false },
//         'custom_favicon': { type: 'IMAGE', category: 'visual', description: 'Custom favicon image', isPublic: true },
//         'default_og_image': { type: 'BOOLEAN', category: 'visual', description: 'Use the default OG image', isPublic: false },
//         'custom_og_image': { type: 'IMAGE', category: 'visual', description: 'Custom Open Graph image', isPublic: true },
//         'datetime_format': { type: 'STRING', category: 'system', description: 'System datetime format', isPublic: false },
//         'distance_unit': { type: 'STRING', category: 'system', description: 'System distance unit', isPublic: false },
//         'website_public': { type: 'BOOLEAN', category: 'advanced', description: 'Make the website public to allow non logged users to view website content', isPublic: true },
//         'newsfeed_public': { type: 'BOOLEAN', category: 'advanced', description: 'Make newsfeed public to allow non logged users to view posts', isPublic: true },
//         'directory_enabled': { type: 'BOOLEAN', category: 'advanced', description: 'Enable user directory for public browsing', isPublic: true },
//         'night_mode_default': { type: 'BOOLEAN', category: 'advanced', description: 'Default to night mode for new users', isPublic: true },
//         'users_can_change_mode': { type: 'BOOLEAN', category: 'advanced', description: 'Allow users to change theme mode', isPublic: true },
//       };

//       // Process all form fields
//       for (const [name, value] of formData.entries()) {
//         if (name.startsWith('setting_')) {
//           const key = name.replace('setting_', '');
//           const definition = settingDefinitions[key as keyof typeof settingDefinitions];
          
//           if (definition) {
//             // Special handling for site-name to sync with website_title
//             if (key === 'website_title') {
//               // Also update site-name when website_title changes
//               updates.push({
//                 key: 'site-name',
//                 value: value.toString(),
//                 type: 'STRING',
//                 category: 'metadata',
//                 description: 'Site name displayed in header and sidebar',
//                 isPublic: true
//               });
//             }
            
//             updates.push({
//               key,
//               value: value.toString(),
//               type: definition.type,
//               category: definition.category,
//               description: definition.description,
//               isPublic: definition.isPublic
//             });
//           }
//         }
//       }

//       console.log('Updating settings:', updates);
//       await updateAppSettings(updates);
//       toast.dismiss(loadingToast);
//       toast.success("App settings updated successfully!");
      
//       // Reload the page to reflect changes in header/sidebar
//       setTimeout(() => {
//         window.location.reload();
//       }, 1500);
//     } catch (error: any) {
//       console.error("Error updating app settings:", error);
//       toast.dismiss(loadingToast);
//       toast.error(error.message || "Failed to update app settings. Please try again later.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div className="text-center">
//         <h1 className="text-3xl font-bold text-foreground mb-3">
//           App Settings
//         </h1>
//         <p className="text-muted-foreground text-lg">
//           Configure application-wide settings and preferences
//         </p>
//       </div>

//       <form action={handleSubmit} className="space-y-8">
//         <Tabs defaultValue="website" className="space-y-6">
//           <TabsList className="grid w-full grid-cols-4">
//             <TabsTrigger value="website">Website</TabsTrigger>
//             <TabsTrigger value="visual">Visual</TabsTrigger>
//             <TabsTrigger value="system">System</TabsTrigger>
//             <TabsTrigger value="advanced">Advanced</TabsTrigger>
//           </TabsList>

//           {/* Website Settings Tab */}
//           <TabsContent value="website" className="space-y-6">
//             {/* Website Live Settings */}
//             <Card className="p-6">
//               <h2 className="text-xl font-semibold mb-6">Website Live Settings</h2>
//               <div className="space-y-6">
//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <div className="flex items-center space-x-2">
//                       <Globe className="h-5 w-5 text-blue-600" />
//                       <Label className="text-base font-semibold">Website Live</Label>
//                     </div>
//                     <p className="text-sm text-muted-foreground">Turn the entire website On and Off</p>
//                   </div>
//                   <Switch
//                     name="setting_website_live"
//                     defaultChecked={getSetting("website_live") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_website_live"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_website_live" value={getSetting("website_live", "true")} />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">Shutdown Message</Label>
//                   <Textarea
//                     name="setting_shutdown_message"
//                     defaultValue={getSetting("shutdown_message", "Come back soon")}
//                     placeholder="The text that is presented when the site is closed"
//                     className="resize-none"
//                     rows={3}
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">System Email</Label>
//                   <Input
//                     name="setting_system_email"
//                     type="email"
//                     defaultValue={getSetting("system_email", "admin@example.com")}
//                     placeholder="The contact email that all messages send to"
//                   />
//                 </div>
//               </div>
//             </Card>

//             {/* Website Metadata */}
//             <Card className="p-6">
//               <h2 className="text-xl font-semibold mb-6">Website Metadata</h2>
//               <div className="space-y-6">
//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">
//                     Site Name <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     name="setting_website_title"
//                     defaultValue={getSetting("website_title") || getSetting("site-name", "Socially App")}
//                     placeholder="Enter site name (will update header and sidebar)"
//                     required
//                     minLength={2}
//                   />
//                   <p className="text-xs text-muted-foreground">
//                     This name will be displayed in the header, sidebar, and browser title
//                   </p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">Website Description</Label>
//                   <Textarea
//                     name="setting_website_description"
//                     defaultValue={getSetting("website_description") || getSetting("site-description", "Share your memories, connect with others, make new friends")}
//                     placeholder="Description of your website"
//                     className="resize-none"
//                     rows={3}
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">Website Keywords</Label>
//                   <Textarea
//                     name="setting_website_keywords"
//                     defaultValue={getSetting("website_keywords", "social network, social platform, connect, friends")}
//                     placeholder="Example: social, social site"
//                     className="resize-none"
//                     rows={3}
//                   />
//                 </div>
//               </div>
//             </Card>
//           </TabsContent>

//           {/* Visual Settings Tab */}
//           <TabsContent value="visual" className="space-y-6">
//             <Card className="p-6">
//               <h2 className="text-xl font-semibold mb-6">Visual Customization</h2>
//               <div className="grid gap-6 md:grid-cols-2">
//                 <ImageUploadField
//                   label="Logo (Light Mode)"
//                   name="logo_light"
//                   icon={Camera}
//                   currentValue={getSetting("logo_light")}
//                 />
//                 <ImageUploadField
//                   label="Logo (Dark Mode)"
//                   name="logo_dark"
//                   icon={Camera}
//                   currentValue={getSetting("logo_dark")}
//                 />
//               </div>

//               <div className="mt-6 space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <div className="flex items-center space-x-2">
//                       <Home className="h-5 w-5 text-purple-600" />
//                       <Label className="text-base font-semibold">Default Wallpaper</Label>
//                     </div>
//                     <p className="text-sm text-muted-foreground">
//                       Use the default (preview) (Disable it to use your custom uploaded image)
//                     </p>
//                   </div>
//                   <Switch
//                     name="setting_default_wallpaper"
//                     defaultChecked={getSetting("default_wallpaper") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_default_wallpaper"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_default_wallpaper" value={getSetting("default_wallpaper", "true")} />
//                 </div>

//                 <ImageUploadField
//                   label="Custom Wallpaper"
//                   name="custom_wallpaper"
//                   icon={Camera}
//                   currentValue={getSetting("custom_wallpaper")}
//                 />

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">Landing Page Layout</Label>
//                   <div className="space-y-2">
//                     <div className="flex items-center space-x-2">
//                       <input 
//                         type="radio" 
//                         id="default" 
//                         name="setting_landing_page_layout" 
//                         value="default"
//                         defaultChecked={getSetting("landing_page_layout", "elengine") === "default"}
//                         className="h-4 w-4"
//                       />
//                       <Label htmlFor="default">Default</Label>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <input 
//                         type="radio" 
//                         id="elengine" 
//                         name="setting_landing_page_layout" 
//                         value="elengine"
//                         defaultChecked={getSetting("landing_page_layout", "elengine") === "elengine"}
//                         className="h-4 w-4"
//                       />
//                       <Label htmlFor="elengine">Elengine (preview)</Label>
//                     </div>
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     You can get the whole Elengine theme from{" "}
//                     <a href="#" className="text-blue-600 hover:underline">Here</a>
//                   </p>
//                 </div>
//               </div>

//               <div className="mt-6 space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <div className="flex items-center space-x-2">
//                       <Star className="h-5 w-5 text-yellow-600" />
//                       <Label className="text-base font-semibold">Default Favicon</Label>
//                     </div>
//                     <p className="text-sm text-muted-foreground">
//                       Use the default (preview) (Disable it to use your custom uploaded image)
//                     </p>
//                   </div>
//                   <Switch
//                     name="setting_default_favicon"
//                     defaultChecked={getSetting("default_favicon") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_default_favicon"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_default_favicon" value={getSetting("default_favicon", "true")} />
//                 </div>

//                 <ImageUploadField
//                   label="Custom Favicon"
//                   name="custom_favicon"
//                   icon={Camera}
//                   currentValue={getSetting("custom_favicon")}
//                 />
//               </div>

//               <div className="mt-6 space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <div className="flex items-center space-x-2">
//                       <Share2 className="h-5 w-5 text-green-600" />
//                       <Label className="text-base font-semibold">Default OG-Image</Label>
//                     </div>
//                     <p className="text-sm text-muted-foreground">
//                       Use the default (preview) (Disable it to use your custom uploaded image)
//                     </p>
//                   </div>
//                   <Switch
//                     name="setting_default_og_image"
//                     defaultChecked={getSetting("default_og_image") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_default_og_image"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_default_og_image" value={getSetting("default_og_image", "true")} />
//                 </div>

//                 <ImageUploadField
//                   label="Custom OG-Image"
//                   name="custom_og_image"
//                   icon={Camera}
//                   description="The perfect size for your og-image should be (width: 590px & height: 300px)"
//                   currentValue={getSetting("custom_og_image")}
//                 />
//               </div>
//             </Card>
//           </TabsContent>

//           {/* System Settings Tab */}
//           <TabsContent value="system" className="space-y-6">
//             <Card className="p-6">
//               <h2 className="text-xl font-semibold mb-6">System Settings</h2>
//               <div className="space-y-6">
//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">System Datetime Format</Label>
//                   <Select name="setting_datetime_format" defaultValue={getSetting("datetime_format", "d/m/Y H:i")}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select datetime format" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="d/m/Y H:i">d/m/Y H:i (Example: 30/05/2023 01:30 PM)</SelectItem>
//                       <SelectItem value="m/d/Y H:i">m/d/Y H:i (Example: 05/30/2023 01:30 PM)</SelectItem>
//                       <SelectItem value="Y-m-d H:i">Y-m-d H:i (Example: 2023-05-30 13:30)</SelectItem>
//                       <SelectItem value="d-m-Y H:i">d-m-Y H:i (Example: 30-05-2023 13:30)</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <p className="text-sm text-muted-foreground">Select the datetime format of the datetime picker</p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">System Distance Unit</Label>
//                   <Select name="setting_distance_unit" defaultValue={getSetting("distance_unit", "kilometer")}>
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select distance unit" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="kilometer">Kilometer</SelectItem>
//                       <SelectItem value="mile">Mile</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <p className="text-sm text-muted-foreground">Select the distance measure unit of your website</p>
//                 </div>
//               </div>
//             </Card>
//           </TabsContent>

//           {/* Advanced Settings Tab */}
//           <TabsContent value="advanced" className="space-y-6">
//             <Card className="p-6">
//               <h2 className="text-xl font-semibold mb-6">Advanced Settings</h2>
//               <div className="space-y-6">
//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <Label className="text-base font-semibold">Website Public</Label>
//                     <p className="text-sm text-muted-foreground">Make the website public to allow non logged users to view website content</p>
//                   </div>
//                   <Switch
//                     name="setting_website_public"
//                     defaultChecked={getSetting("website_public") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_website_public"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_website_public" value={getSetting("website_public", "false")} />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <Label className="text-base font-semibold">Newsfeed Public</Label>
//                     <p className="text-sm text-muted-foreground">Make newsfeed public to allow non logged users to view posts</p>
//                   </div>
//                   <Switch
//                     name="setting_newsfeed_public"
//                     defaultChecked={getSetting("newsfeed_public") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_newsfeed_public"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_newsfeed_public" value={getSetting("newsfeed_public", "false")} />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <Label className="text-base font-semibold">Directory Enabled</Label>
//                     <p className="text-sm text-muted-foreground">Enable user directory for public browsing</p>
//                   </div>
//                   <Switch
//                     name="setting_directory_enabled"
//                     defaultChecked={getSetting("directory_enabled") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_directory_enabled"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_directory_enabled" value={getSetting("directory_enabled", "true")} />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <Label className="text-base font-semibold">Night Mode Default</Label>
//                     <p className="text-sm text-muted-foreground">Default to night mode for new users</p>
//                   </div>
//                   <Switch
//                     name="setting_night_mode_default"
//                     defaultChecked={getSetting("night_mode_default") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_night_mode_default"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_night_mode_default" value={getSetting("night_mode_default", "false")} />
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <Label className="text-base font-semibold">Users Can Change Mode</Label>
//                     <p className="text-sm text-muted-foreground">Allow users to change theme mode</p>
//                   </div>
//                   <Switch
//                     name="setting_users_can_change_mode"
//                     defaultChecked={getSetting("users_can_change_mode") === "true"}
//                     onCheckedChange={(checked) => {
//                       const hiddenInput = document.querySelector('input[name="setting_users_can_change_mode"]') as HTMLInputElement;
//                       if (hiddenInput) hiddenInput.value = checked.toString();
//                     }}
//                   />
//                   <input type="hidden" name="setting_users_can_change_mode" value={getSetting("users_can_change_mode", "true")} />
//                 </div>
//               </div>
//             </Card>
//           </TabsContent>
//         </Tabs>

//         <div className="flex justify-end">
//           <Button 
//             type="submit" 
//             disabled={loading}
//             className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-lg font-medium"
//           >
//             {loading ? "Updating..." : "Save All Changes"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// }