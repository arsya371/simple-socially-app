"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { updateModerationSettings } from "@/app/api/admin/settings/actions";

interface ViolationSettingsProps {
  violationThreshold: number;
  suspensionDurationHours: number;
}

export default function ViolationSettings({ violationThreshold, suspensionDurationHours }: ViolationSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData();
      formData.append("violation_threshold", (form.elements.namedItem('violation_threshold') as HTMLInputElement).value);
      formData.append("suspension_duration_hours", (form.elements.namedItem('suspension_duration_hours') as HTMLInputElement).value);

      await updateModerationSettings(formData);
      toast.success("Violation settings updated successfully");
    } catch (error) {
      console.error("Error updating violation settings:", error);
      toast.error("Failed to update violation settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="violation-threshold">Violation Threshold</Label>
        <p className="text-sm text-gray-500 mb-2">
          Number of violations within 24 hours before account suspension
        </p>
        <Input
          type="number"
          id="violation-threshold"
          name="violation_threshold"
          defaultValue={violationThreshold}
          min={1}
        />
      </div>

      <div>
        <Label htmlFor="suspension-duration">Suspension Duration (Hours)</Label>
        <p className="text-sm text-gray-500 mb-2">
          How long users will be suspended after reaching the violation threshold
        </p>
        <Input
          type="number"
          id="suspension-duration"
          name="suspension_duration_hours"
          defaultValue={suspensionDurationHours}
          min={1}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Violation Settings"}
      </Button>
    </form>
  );
}