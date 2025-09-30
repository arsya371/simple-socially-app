"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, KeyboardEvent } from "react";
import { toast } from "react-hot-toast";
import { updateModerationSettings } from "@/app/api/admin/settings/actions";

interface ModerationSettingsProps {
  settings: {
    passwordComplexityEnabled: boolean;
    reservedUsernamesEnabled: boolean;
    censoredWordsEnabled: boolean;
    censoredDomainsEnabled: boolean;
    reservedUsernames: string[];
    censoredWords: string[];
    censoredDomains: string[];
  };
}

export default function ModerationSettings({ settings }: ModerationSettingsProps) {
  const [formState, setFormState] = useState<ModerationSettingsProps["settings"]>(settings);
  const [inputValues, setInputValues] = useState({
    username: "",
    word: "",
    domain: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("passwordComplexityEnabled", String(formState.passwordComplexityEnabled));
      formData.append("reservedUsernamesEnabled", String(formState.reservedUsernamesEnabled));
      formData.append("censoredWordsEnabled", String(formState.censoredWordsEnabled));
      formData.append("censoredDomainsEnabled", String(formState.censoredDomainsEnabled));
      formData.append("reservedUsernames", JSON.stringify(formState.reservedUsernames));
      formData.append("censoredWords", JSON.stringify(formState.censoredWords));
      formData.append("censoredDomains", JSON.stringify(formState.censoredDomains));

      await updateModerationSettings(formData);
      toast.success("Moderation settings updated successfully");
    } catch (error) {
      console.error("Error updating moderation settings:", error);
      toast.error("Failed to update moderation settings");
    }
  };

  const handleToggleChange = (setting: keyof typeof formState) => {
    setFormState(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleAddItem = (type: 'username' | 'word' | 'domain') => {
    const value = inputValues[type].trim().toLowerCase();
    if (!value) return;

    const key = type === 'username' ? 'reservedUsernames' : 
                type === 'word' ? 'censoredWords' : 'censoredDomains';

    if (!formState[key].includes(value)) {
      setFormState(prev => ({
        ...prev,
        [key]: [...prev[key], value]
      }));
    }

    setInputValues(prev => ({
      ...prev,
      [type]: ''
    }));
  };

  const handleRemoveItem = (type: 'username' | 'word' | 'domain', index: number) => {
    const key = type === 'username' ? 'reservedUsernames' : 
                type === 'word' ? 'censoredWords' : 'censoredDomains';

    setFormState(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="p-6">
        {/* Password Complexity System */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Password Complexity System</Label>
              <p className="text-sm text-muted-foreground">
                This system will require a powerful password including letters, numbers and special characters
              </p>
            </div>
            <Switch
              checked={formState.passwordComplexityEnabled}
              onCheckedChange={() => handleToggleChange('passwordComplexityEnabled')}
            />
          </div>

          {/* Reserved Usernames */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Reserved Usernames Enabled</Label>
                <p className="text-sm text-muted-foreground">Enable/Disable Reserved Usernames</p>
              </div>
              <Switch
                checked={formState.reservedUsernamesEnabled}
                onCheckedChange={() => handleToggleChange('reservedUsernamesEnabled')}
              />
          </div>

          {formState.reservedUsernamesEnabled && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add reserved username"
                  value={inputValues.username}
                  onChange={(e) => setInputValues(prev => ({ ...prev, username: e.target.value }))}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddItem('username');
                    }
                  }}
                />
                <Button 
                  type="button"
                  onClick={() => handleAddItem('username')}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formState.reservedUsernames.map((username, index) => (
                  <Badge key={index} variant="secondary">
                    {username}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('username', index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
          </div>

        {/* Censored Words */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Censored Words Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Enable/Disable Words to be censored
              </p>
            </div>
            <Switch
              checked={formState.censoredWordsEnabled}
              onCheckedChange={() => handleToggleChange('censoredWordsEnabled')}
            />
          </div>

          {formState.censoredWordsEnabled && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add censored word"
                  value={inputValues.word}
                  onChange={(e) => setInputValues(prev => ({ ...prev, word: e.target.value }))}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddItem('word');
                    }
                  }}
                />
                <Button 
                  type="button"
                  onClick={() => handleAddItem('word')}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formState.censoredWords.map((word, index) => (
                  <Badge key={index} variant="secondary">
                    {word}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('word', index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Censored Domains */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Censored Domains Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Enable/Disable Domains to be censored (will not be fetched)
              </p>
            </div>
            <Switch
              checked={formState.censoredDomainsEnabled}
              onCheckedChange={() => handleToggleChange('censoredDomainsEnabled')}
            />
          </div>

          {formState.censoredDomainsEnabled && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add censored domain"
                  value={inputValues.domain}
                  onChange={(e) => setInputValues(prev => ({ ...prev, domain: e.target.value }))}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddItem('domain');
                    }
                  }}
                />
                <Button 
                  type="button"
                  onClick={() => handleAddItem('domain')}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formState.censoredDomains.map((domain, index) => (
                  <Badge key={index} variant="secondary">
                    {domain}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('domain', index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Button type="submit" className="w-full">
        Save Changes
      </Button>
    </form>
  );
}