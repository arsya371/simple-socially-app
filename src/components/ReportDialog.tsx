"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface ReportDialogProps {
  type: "POST" | "COMMENT" | "PROFILE";
  targetId: string;
}

const reportReasons = {
  POST: [
    { id: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content" },
    { id: "HARASSMENT", label: "Harassment" },
    { id: "HATE_SPEECH", label: "Hate Speech" },
    { id: "VIOLENCE", label: "Violence" },
    { id: "NUDITY", label: "Nudity or Sexual Content" },
    { id: "SPAM", label: "Spam" },
    { id: "MISINFORMATION", label: "False Information" },
    { id: "OTHER", label: "Other" },
  ],
  PROFILE: [
    { id: "FAKE_ACCOUNT", label: "Fake Account" },
    { id: "IMPERSONATION", label: "Impersonation" },
    { id: "HARASSMENT", label: "Harassment" },
    { id: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content" },
    { id: "SPAM", label: "Spam Activities" },
    { id: "OTHER", label: "Other" },
  ],
  COMMENT: [
    { id: "HARASSMENT", label: "Harassment" },
    { id: "HATE_SPEECH", label: "Hate Speech" },
    { id: "SPAM", label: "Spam" },
    { id: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content" },
    { id: "OTHER", label: "Other" },
  ],
};

export function ReportDialog({ type, targetId }: ReportDialogProps) {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReport() {
    if (!selectedReason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Submitting report...");

    try {
      const res = await fetch("/api/admin/reports/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          targetId,
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit report");
      }

      toast.success("Report submitted successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report. Please try again later.");
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Report">
          <Flag className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Report {type.toLowerCase()}</AlertDialogTitle>
          <AlertDialogDescription>
            Help us understand what&apos;s wrong with this {type.toLowerCase()}. Your report will be sent to moderators for review.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            value={selectedReason}
            onValueChange={setSelectedReason}
            className="gap-3"
          >
            {reportReasons[type].map((reason) => (
              <div key={reason.id} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id}>{reason.label}</Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Please provide any additional context that will help us understand the issue..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleReport}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}