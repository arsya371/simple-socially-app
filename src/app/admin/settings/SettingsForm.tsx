"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { updateModerationSettings, updateApiSettings, updateSecuritySettings } from "@/app/api/admin/settings/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const getSetting = (key: string, defaultValue: string = "") => {
    const setting = settings.find((s: Setting) => s.key === key);
    if (!setting) return defaultValue;

    if (key === 'prohibited_keywords' || key === 'censored_domains') {
      try {
        const parsedValue = JSON.parse(setting.value);
        if (Array.isArray(parsedValue)) return parsedValue.join(', ');
      } catch (e) { /* Fallback to raw value */ }
    }
    return setting.value;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [switchStates, setSwitchStates] = useState({
    censoredWordsEnabled: getSetting("censored_words_enabled") === "true",
    censoredDomainsEnabled: getSetting("censored_domains_enabled") === "true",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>, action: (formData: FormData) => Promise<any>) => {
    event.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Saving settings...");

    const formData = new FormData(event.currentTarget);
    // Manually append switch states for moderation tab
    if (action.name === 'updateModerationSettings') {
      formData.append("censored_words_enabled", String(switchStates.censoredWordsEnabled));
      formData.append("censored_domains_enabled", String(switchStates.censoredDomainsEnabled));
    }
    
    try {
      await action(formData);
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      toast.dismiss(loadingToast);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-3">Site Settings</h1>
        <p className="text-muted-foreground text-lg">Configure your application settings and preferences</p>
      </div>

      <Tabs defaultValue="moderation" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 bg-secondary p-1 rounded-lg">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <form onSubmit={(e) => handleSubmit(e, updateSecuritySettings)}>
            <Card className="p-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allow-signups">Allow New Signups</Label>
                  <select id="allow-signups" name="allow-signups" className="w-full p-2 border rounded-md" defaultValue={getSetting("allow-signups", "true")}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-suspend">Auto-Suspend After Reports</Label>
                  <Input id="auto-suspend" name="auto-suspend" type="number" min="0" placeholder="Number of reports" defaultValue={getSetting("auto-suspend", "0")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input id="max-login-attempts" name="max-login-attempts" type="number" min="1" placeholder="Max login attempts" defaultValue={getSetting("max-login-attempts", "5")} />
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="moderation">
          <form onSubmit={(e) => handleSubmit(e, updateModerationSettings)}>
            <Card className="p-6 space-y-6">
              <div className="space-y-4 p-4 bg-muted rounded-md border">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="censored-words-enabled" className="text-base font-semibold">Enable Word Censoring</Label>
                    <p className="text-sm text-muted-foreground">Automatically censor prohibited words.</p>
                  </div>
                  <Switch id="censored-words-enabled" checked={switchStates.censoredWordsEnabled} onCheckedChange={(checked) => setSwitchStates(prev => ({ ...prev, censoredWordsEnabled: checked }))} />
                </div>
                <div>
                  <Label htmlFor="prohibited-words">Censored Words</Label>
                  <Textarea id="prohibited_keywords" name="prohibited_keywords" placeholder="badword1, badword2, anotherword" className="mt-2" defaultValue={getSetting("prohibited_keywords")} />
                  <p className="text-sm text-muted-foreground mt-2">Comma-separated list of words to be censored.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="violation-threshold">Violation Threshold</Label>
                  <Input id="violation_threshold" name="violation_threshold" type="number" min="1" defaultValue={getSetting("violation_threshold", "3")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suspension-duration">Suspension Duration (Hours)</Label>
                  <Input id="suspension_duration_hours" name="suspension_duration_hours" type="number" min="1" defaultValue={getSetting("suspension_duration_hours", "24")} />
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="api">
          <form onSubmit={(e) => handleSubmit(e, updateApiSettings)}>
            <Card className="p-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-enabled">Enable API Access</Label>
                  <select id="api-enabled" name="api-enabled" className="w-full p-2 border rounded-md" defaultValue={getSetting("api-enabled", "false")}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate-limit-requests">Rate Limit (Requests)</Label>
                  <Input id="rate-limit-requests" name="rate-limit-requests" type="number" min="1" defaultValue={getSetting("rate-limit-requests", "100")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate-limit-window">Rate Limit Window (Seconds)</Label>
                  <Input id="rate-limit-window" name="rate-limit-window" type="number" min="1" defaultValue={getSetting("rate-limit-window", "60")} />
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}


// 2. GEMINI
// "use client";

// import { useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { toast } from "react-hot-toast";
// import { updateModerationSettings, updateApiSettings, updateSecuritySettings } from "@/app/api/admin/settings/actions";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// interface Setting {
//   id: string;
//   key: string;
//   value: string;
//   category: string;
//   updatedAt: Date;
//   updatedBy: string;
// }

// interface SettingsFormProps {
//   settings: Setting[];
// }

// export default function SettingsForm({ settings }: SettingsFormProps) {
//   const getSetting = (key: string) => {
//     const setting = settings.find((s: Setting) => s.key === key);
//     // Handle parsing of JSON strings for textareas
//     if (setting && (key === 'prohibited_keywords' || key === 'censored_domains')) {
//       try {
//         const parsedValue = JSON.parse(setting.value);
//         if (Array.isArray(parsedValue)) {
//           return parsedValue.join(', ');
//         }
//       } catch (e) {
//         // Fallback for non-JSON or invalid JSON
//         return setting.value;
//       }
//     }
//     return setting?.value || "";
//   };

//   const [isLoading, setIsLoading] = useState(false);
  
//   const [switchStates, setSwitchStates] = useState({
//     censoredWordsEnabled: getSetting("censored_words_enabled") === "true",
//     censoredDomainsEnabled: getSetting("censored_domains_enabled") === "true",
//   });

//   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsLoading(true);
//     const loadingToast = toast.loading("Updating settings...");

//     const formData = new FormData(event.currentTarget);

//     try {
//       // Security Settings
//       const securityData = new FormData();
//       securityData.append("allow-signups", formData.get("allow-signups") as string);
//       securityData.append("auto-suspend", formData.get("auto-suspend") as string);
//       securityData.append("max-login-attempts", formData.get("max-login-attempts") as string);
//       await updateSecuritySettings(securityData);

//       // Moderation Settings
//       const moderationData = new FormData();
//       const keywords = (formData.get("prohibited_keywords") as string).split(',').map(k => k.trim()).filter(Boolean);
//       const domains = (formData.get("censored_domains") as string).split(',').map(d => d.trim()).filter(Boolean);
      
//       moderationData.append("prohibited_keywords", JSON.stringify(keywords));
//       moderationData.append("censored_domains", JSON.stringify(domains));
//       moderationData.append("censored_words_enabled", String(switchStates.censoredWordsEnabled));
//       moderationData.append("censored_domains_enabled", String(switchStates.censoredDomainsEnabled));
//       moderationData.append("require-approval", formData.get("require-approval") as string);
//       moderationData.append("report_threshold", formData.get("report_threshold") as string);
//       moderationData.append("violation_threshold", formData.get("violation_threshold") as string);
//       moderationData.append("suspension_duration_hours", formData.get("suspension_duration_hours") as string);
//       await updateModerationSettings(moderationData);

//       // API Settings
//       const apiData = new FormData();
//       apiData.append("api-enabled", formData.get("api-enabled") as string);
//       apiData.append("rate-limit-requests", formData.get("rate-limit-requests") as string);
//       apiData.append("rate-limit-window", formData.get("rate-limit-window") as string);
//       await updateApiSettings(apiData);

//       toast.dismiss(loadingToast);
//       toast.success("All settings have been saved successfully!");
      
//     } catch (error: any) {
//       toast.dismiss(loadingToast);
//       toast.error(error.message || "An unexpected error occurred.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div className="text-center">
//         <h1 className="text-3xl font-bold text-foreground mb-3">
//           Site Settings
//         </h1>
//         <p className="text-muted-foreground text-lg">
//           Configure your application settings and preferences
//         </p>
//       </div>

//     <form onSubmit={handleSubmit} className="space-y-8">
//       <Tabs defaultValue="moderation" className="space-y-8">
//         <TabsList className="grid w-full grid-cols-3 bg-secondary p-1 rounded-lg">
//           <TabsTrigger value="security">Security</TabsTrigger>
//           <TabsTrigger value="moderation">Moderation</TabsTrigger>
//           <TabsTrigger value="api">API</TabsTrigger>
//         </TabsList>

//         <TabsContent value="security" className="space-y-4">
//           <Card className="p-6">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="allow-signups">Allow New Signups</Label>
//                   <select id="allow-signups" name="allow-signups" className="w-full p-2 border rounded-md" defaultValue={getSetting("allow-signups")}>
//                     <option value="true">Yes</option>
//                     <option value="false">No</option>
//                   </select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="auto-suspend">Auto-Suspend After Reports</Label>
//                   <Input id="auto-suspend" name="auto-suspend" type="number" min="0" placeholder="Number of reports" defaultValue={getSetting("auto-suspend")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
//                   <Input id="max-login-attempts" name="max-login-attempts" type="number" min="1" placeholder="Max login attempts" defaultValue={getSetting("max-login-attempts")} />
//                 </div>
//               </div>
//           </Card>
//         </TabsContent>

//         <TabsContent value="moderation" className="space-y-4">
//           <Card className="p-6 space-y-6">
//             <div className="space-y-4 p-4 bg-muted rounded-md border">
//               <div className="flex items-center justify-between">
//                 <div className="space-y-1">
//                   <Label htmlFor="censored-words-enabled" className="text-base font-semibold">Enable Word Censoring</Label>
//                   <p className="text-sm text-muted-foreground">Automatically censor prohibited words.</p>
//                 </div>
//                 <Switch id="censored-words-enabled" checked={switchStates.censoredWordsEnabled} onCheckedChange={(checked) => setSwitchStates(prev => ({ ...prev, censoredWordsEnabled: checked }))} />
//               </div>
//               <div>
//                 <Label htmlFor="prohibited-words">Censored Words</Label>
//                 <Textarea id="prohibited-words" name="prohibited_keywords" placeholder="badword1, badword2, anotherword" className="mt-2" defaultValue={getSetting("prohibited_keywords")} />
//                 <p className="text-sm text-muted-foreground mt-2">Comma-separated list of words to be censored.</p>
//               </div>
//             </div>

//             <div className="space-y-4 p-4 bg-muted rounded-md border">
//                 <div className="flex items-center justify-between">
//                     <div className="space-y-1">
//                         <Label htmlFor="censored-domains-enabled" className="text-base font-semibold">Enable Domain Blocking</Label>
//                         <p className="text-sm text-muted-foreground">Block links from specific domains.</p>
//                     </div>
//                     <Switch id="censored-domains-enabled" checked={switchStates.censoredDomainsEnabled} onCheckedChange={(checked) => setSwitchStates(prev => ({...prev, censoredDomainsEnabled: checked }))} />
//                 </div>
//                 <div>
//                     <Label htmlFor="censored-domains">Censored Domains</Label>
//                     <Textarea id="censored-domains" name="censored_domains" placeholder="domain1.com, domain2.net" className="mt-2" defaultValue={getSetting("censored_domains")} />
//                     <p className="text-sm text-muted-foreground mt-2">Comma-separated list of domains to block.</p>
//                 </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="violation-threshold">Violation Threshold</Label>
//                 <Input id="violation-threshold" name="violation_threshold" type="number" min="1" defaultValue={getSetting("violation_threshold") || "3"} placeholder="Violations before suspension" />
//                 <p className="text-sm text-muted-foreground">Violations within 24 hours before auto-suspension.</p>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="suspension-duration">Suspension Duration (Hours)</Label>
//                 <Input id="suspension-duration" name="suspension_duration_hours" type="number" min="1" defaultValue={getSetting("suspension_duration_hours") || "24"} placeholder="Suspension duration in hours" />
//               </div>
//             </div>
            
//             <div className="space-y-2">
//                 <Label htmlFor="require-approval">Require Post Approval</Label>
//                 <Select name="require-approval" defaultValue={getSetting("require-approval") || "false"}>
//                     <SelectTrigger id="require-approval">
//                         <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                         <SelectItem value="false">No</SelectItem>
//                         <SelectItem value="true">Yes</SelectItem>
//                     </SelectContent>
//                 </Select>
//             </div>

//              <div className="space-y-2">
//                 <Label htmlFor="report-threshold">Report Threshold</Label>
//                 <Input id="report-threshold" name="report_threshold" type="number" min="1" defaultValue={getSetting("report_threshold") || "5"} placeholder="Reports before content is hidden" />
//              </div>

//           </Card>
//         </TabsContent>

//         <TabsContent value="api" className="space-y-4">
//           <Card className="p-6">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="api-enabled">Enable API Access</Label>
//                   <select id="api-enabled" name="api-enabled" className="w-full p-2 border rounded-md" defaultValue={getSetting("api-enabled")}>
//                     <option value="false">No</option>
//                     <option value="true">Yes</option>
//                   </select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="rate-limit-requests">Rate Limit (Requests)</Label>
//                   <Input id="rate-limit-requests" name="rate-limit-requests" type="number" min="1" placeholder="Max requests per window" defaultValue={getSetting("rate-limit-requests")} />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="rate-limit-window">Rate Limit Window (Seconds)</Label>
//                   <Input id="rate-limit-window" name="rate-limit-window" type="number" min="1" placeholder="Time window in seconds" defaultValue={getSetting("rate-limit-window")} />
//                 </div>
//               </div>
//           </Card>
//         </TabsContent>
//       </Tabs>
//         <div className="flex justify-end pt-4">
//             <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
//                 {isLoading ? 'Saving...' : 'Save All Changes'}
//             </Button>
//         </div>
//     </form>
//     </div>
//   );
// }




// 1. CURSOR
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
// import { toast } from "react-hot-toast";
// import { updateGeneralSettings, updateSecuritySettings, updateModerationSettings, updateApiSettings } from "@/app/api/admin/settings/actions";

// interface Setting {
//   id: string;
//   key: string;
//   value: string;
//   category: string;
//   updatedAt: Date;
//   updatedBy: string;
// }

// interface SettingsFormProps {
//   settings: Setting[];
// }

// export default function SettingsForm({ settings }: SettingsFormProps) {
//   const getSetting = (key: string) => settings.find((s: Setting) => s.key === key)?.value || "";
  
//   // State for switch controls
//   const [switchStates, setSwitchStates] = useState({
//     censoredWordsEnabled: getSetting("censored_words_enabled") === "true",
//     censoredDomainsEnabled: getSetting("censored_domains_enabled") === "true",
//   });

//   // async function handleGeneralSubmit(formData: FormData) {
//   //   const loadingToast = toast.loading("Updating general settings...");
//   //   try {
//   //     await updateGeneralSettings(formData);
//   //     toast.success("General settings updated successfully!");
//   //   } catch (error: any) {
//   //     console.error("Error updating general settings:", error);
//   //     toast.error(
//   //       error.message || "Failed to update settings. Please try again later."
//   //     );
//   //   } finally {
//   //     toast.dismiss(loadingToast);
//   //   }
//   // }

//   async function handleSecuritySubmit(formData: FormData) {
//     try {
//       const loadingToast = toast.loading("Updating security settings...");
//       await updateSecuritySettings(formData);
//       toast.dismiss(loadingToast);
//       toast.success("Security settings updated successfully!");
//     } catch (error: any) {
//       toast.error(error.message || "Failed to update settings");
//     }
//   }

//   async function handleModerationSubmit(formData: FormData) {
//     try {
//       const loadingToast = toast.loading("Updating moderation settings...");
      
//       // Add switch states to form data
//       formData.append("censored_words_enabled", String(switchStates.censoredWordsEnabled));
//       formData.append("censored_domains_enabled", String(switchStates.censoredDomainsEnabled));
      
//       await updateModerationSettings(formData);
//       toast.dismiss(loadingToast);
//       toast.success("Moderation settings updated successfully!");
//     } catch (error: any) {
//       toast.error(error.message || "Failed to update settings");
//     }
//   }

//   async function handleApiSubmit(formData: FormData) {
//     try {
//       const loadingToast = toast.loading("Updating API settings...");
//       await updateApiSettings(formData);
//       toast.dismiss(loadingToast);
//       toast.success("API settings updated successfully!");
//     } catch (error: any) {
//       toast.error(error.message || "Failed to update settings");
//     }
//   }

//   return (
//     <div className="space-y-8">
//       <div className="text-center">
//         <h1 className="text-3xl font-bold text-foreground mb-3">
//           Site Settings
//         </h1>
//         <p className="text-muted-foreground text-lg">
//           Configure your application settings and preferences
//         </p>
//       </div>

//       <Tabs defaultValue="security" className="space-y-8">
//         <TabsList className="grid w-full grid-cols-3 bg-secondary p-1 rounded-lg">
//           {/* <TabsTrigger 
//             value="general" 
//             className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
//           >
//             General
//           </TabsTrigger> */}
//           <TabsTrigger 
//             value="security"
//             className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
//           >
//             Security
//           </TabsTrigger>
//           <TabsTrigger 
//             value="moderation"
//             className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
//           >
//             Moderation
//           </TabsTrigger>
//           <TabsTrigger 
//             value="api"
//             className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
//           >
//             API
//           </TabsTrigger>
//         </TabsList>

//         {/* <TabsContent value="general" className="space-y-6">
//           <Card className="p-8">
//             <form action={handleGeneralSubmit} className="space-y-6">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="site-name">Site Name<span className="text-red-500">*</span></Label>
//                   <Input 
//                     id="site-name" 
//                     name="site-name"
//                     placeholder="Enter site name" 
//                     defaultValue={getSetting("site-name")}
//                     required
//                     minLength={2}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="site-description">Site Description</Label>
//                   <Textarea 
//                     id="site-description"
//                     name="site-description" 
//                     placeholder="Enter site description"
//                     defaultValue={getSetting("site-description")}
//                     rows={3}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="contact-email">Contact Email</Label>
//                   <Input 
//                     id="contact-email"
//                     name="contact-email"
//                     type="email"
//                     placeholder="Enter contact email"
//                     defaultValue={getSetting("contact-email")}
//                   />
//                 </div>
//               </div>
//               <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium">
//                 Save Changes
//               </Button>
//             </form>
//           </Card>
//         </TabsContent> */}

//         <TabsContent value="security" className="space-y-4">
//           <Card className="p-6">
//             <form action={handleSecuritySubmit} className="space-y-4">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="allow-signups">Allow New Signups</Label>
//                   <select 
//                     id="allow-signups"
//                     name="allow-signups"
//                     className="w-full p-2 border rounded-md"
//                     defaultValue={getSetting("allow-signups")}
//                   >
//                     <option value="true">Yes</option>
//                     <option value="false">No</option>
//                   </select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="auto-suspend">Auto-Suspend After Reports</Label>
//                   <Input 
//                     id="auto-suspend"
//                     name="auto-suspend"
//                     type="number"
//                     min="0"
//                     placeholder="Number of reports before auto-suspension"
//                     defaultValue={getSetting("auto-suspend")}
//                   />
//                   <p className="text-sm text-muted-foreground">
//                     Set to 0 to disable auto-suspension
//                   </p>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
//                   <Input 
//                     id="max-login-attempts"
//                     name="max-login-attempts"
//                     type="number"
//                     min="1"
//                     placeholder="Maximum login attempts before lockout"
//                     defaultValue={getSetting("max-login-attempts")}
//                   />
//                 </div>
//               </div>
//               <Button type="submit">Update Security Settings</Button>
//             </form>
//           </Card>
//         </TabsContent>

//         <TabsContent value="moderation" className="space-y-4">
//           <Card className="p-6">
//             <form action={handleModerationSubmit} className="space-y-6">
//               {/* Censored Words Section */}
//               <div className="space-y-4 p-4 bg-muted rounded-md border border-border">
//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <Label htmlFor="censored-words-enabled" className="text-base font-semibold">
//                       Censored Words Enabled
//                     </Label>
//                     <p className="text-sm text-muted-foreground">
//                       Enable automatic censoring of prohibited words
//                     </p>
//                   </div>
//                   <Switch
//                     id="censored-words-enabled"
//                     checked={switchStates.censoredWordsEnabled}
//                     onCheckedChange={(checked) => 
//                       setSwitchStates(prev => ({ ...prev, censoredWordsEnabled: checked }))
//                     }
//                     className="data-[state=checked]:bg-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="prohibited-words">Censored Words</Label>
//                   <Textarea
//                     id="prohibited-words"
//                     name="prohibited_keywords"
//                     placeholder="Words to be censored, separated by a comma (,)"
//                     className="mt-2"
//                     defaultValue={(() => {
//                       try {
//                         const keywords = JSON.parse(getSetting("prohibited_keywords") || "[]");
//                         return Array.isArray(keywords) ? keywords.join(", ") : "";
//                       } catch {
//                         return "";
//                       }
//                     })()}
//                   />
//                   <p className="text-sm text-muted-foreground mt-2">
//                     Words to be censored, separated by a comma (,)
//                   </p>
//                 </div>
//               </div>

//               {/* Censored Domains Section */}
//               <div className="space-y-4 p-4 bg-muted rounded-md border border-border">
//                 <div className="flex items-center justify-between">
//                   <div className="space-y-1">
//                     <Label htmlFor="censored-domains-enabled" className="text-base font-semibold">
//                       Censored Domains Enabled
//                     </Label>
//                     <p className="text-sm text-muted-foreground">
//                       Block links from specific domains
//                     </p>
//                   </div>
//                   <Switch
//                     id="censored-domains-enabled"
//                     checked={switchStates.censoredDomainsEnabled}
//                     onCheckedChange={(checked) => 
//                       setSwitchStates(prev => ({ ...prev, censoredDomainsEnabled: checked }))
//                     }
//                     className="data-[state=checked]:bg-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="censored-domains">Censored Domains</Label>
//                   <Textarea
//                     id="censored-domains"
//                     name="censored_domains"
//                     placeholder="domains to be censored, separated by a comma (,) Ex: domain1.com, domain2.com"
//                     className="mt-2"
//                     defaultValue={(() => {
//                       try {
//                         const domains = JSON.parse(getSetting("censored_domains") || "[]");
//                         return Array.isArray(domains) ? domains.join(", ") : "";
//                       } catch {
//                         return "";
//                       }
//                     })()}
//                   />
//                   <p className="text-sm text-muted-foreground mt-2">
//                     domains to be censored, separated by a comma (,) Ex: domain1.com, domain2.com
//                   </p>
//                 </div>
//               </div>
              
//               {/* Additional Settings */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-md border border-border">
//                 <div className="space-y-2">
//                   <Label htmlFor="violation-threshold" className="text-base font-semibold">
//                     Violation Threshold
//                   </Label>
//                   <Input
//                     id="violation-threshold"
//                     name="violation_threshold"
//                     type="number"
//                     min="1"
//                     className="mt-2"
//                     defaultValue={getSetting("violation_threshold") || "3"}
//                     placeholder="Number of violations before suspension"
//                   />
//                   <p className="text-sm text-muted-foreground">
//                     Number of violations within 24 hours before account suspension
//                   </p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="suspension-duration" className="text-base font-semibold">
//                     Suspension Duration (Hours)
//                   </Label>
//                   <Input
//                     id="suspension-duration"
//                     name="suspension_duration_hours"
//                     type="number"
//                     min="1"
//                     className="mt-2"
//                     defaultValue={getSetting("suspension_duration_hours") || "24"}
//                     placeholder="Duration of account suspension in hours"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="require-post-approval" className="text-base font-semibold">
//                     Require Post Approval
//                   </Label>
//                   <Select
//                     name="require_post_approval"
//                     defaultValue={getSetting("require_post_approval") || "false"}
//                   >
//                     <SelectTrigger id="require-post-approval" className="mt-2">
//                       <SelectValue placeholder="Select an option" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="false">No</SelectItem>
//                       <SelectItem value="true">Yes</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="report-threshold" className="text-base font-semibold">
//                     Report Threshold
//                   </Label>
//                   <Input
//                     id="report-threshold"
//                     name="report_threshold"
//                     type="number"
//                     min="1"
//                     className="mt-2"
//                     defaultValue={getSetting("report_threshold") || "5"}
//                     placeholder="Number of reports before content is hidden"
//                   />
//                 </div>
//               </div>

//               <Button 
//                 type="submit" 
//                 className="w-full"
//               >
//                 Update Moderation Settings
//               </Button>
//             </form>
//           </Card>
//         </TabsContent>

//         <TabsContent value="api" className="space-y-4">
//           <Card className="p-6">
//             <form action={handleApiSubmit} className="space-y-4">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="api-enabled">Enable API Access</Label>
//                   <select 
//                     id="api-enabled"
//                     name="api-enabled"
//                     className="w-full p-2 border rounded-md"
//                     defaultValue={getSetting("api-enabled")}
//                   >
//                     <option value="false">No</option>
//                     <option value="true">Yes</option>
//                   </select>
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="rate-limit-requests">Rate Limit (Requests)</Label>
//                   <Input 
//                     id="rate-limit-requests"
//                     name="rate-limit-requests"
//                     type="number"
//                     min="1"
//                     placeholder="Maximum requests per window"
//                     defaultValue={getSetting("rate-limit-requests")}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="rate-limit-window">Rate Limit Window (Seconds)</Label>
//                   <Input 
//                     id="rate-limit-window"
//                     name="rate-limit-window"
//                     type="number"
//                     min="1"
//                     placeholder="Time window in seconds"
//                     defaultValue={getSetting("rate-limit-window")}
//                   />
//                   <p className="text-sm text-muted-foreground">
//                     Example: 100 requests per 60 seconds
//                   </p>
//                 </div>
//               </div>
//               <Button type="submit">Update API Settings</Button>
//             </form>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }