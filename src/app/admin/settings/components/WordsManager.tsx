"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { updateModerationSettings } from "@/app/api/admin/settings/actions";

interface WordsManagerProps {
  type: "prohibited" | "blocked";
  words: string[];
  onWordsChange?: (words: string[]) => void;
}

export default function WordsManager({ type, words: initialWords, onWordsChange }: WordsManagerProps) {
  const [words, setWords] = useState<string[]>(initialWords ?? []);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = type === "prohibited" ? "Prohibited Words" : "Blocked Words";
  const description = type === "prohibited"
    ? "Words that will be censored in posts and comments"
    : "Words that will cause the content to be blocked";

  const addWord = (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return;
    
    if (!words.includes(trimmed)) {
      const newWords = [...words, trimmed];
      setWords(newWords);
      onWordsChange?.(newWords);
    }
    setInputValue("");
  };

  const removeWord = (indexToRemove: number) => {
    const newWords = words.filter((_, index) => index !== indexToRemove);
    setWords(newWords);
    onWordsChange?.(newWords);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addWord(inputValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append(type === "prohibited" ? "prohibited_keywords" : "blocked_words", JSON.stringify(words));
      
      await updateModerationSettings(formData);
      toast.success(`${title} updated successfully`);
    } catch (error) {
      console.error("Error updating moderation settings:", error);
      toast.error(`Failed to update ${title.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{title}</Label>
        <p className="text-sm text-gray-500 mt-1 mb-3">
          {description}. Press Enter or comma to add.
        </p>

        {/* Words list */}
        <div className="mb-4">
          <Label className="text-sm text-muted-foreground">
            Current {title} ({words.length})
          </Label>
          <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/30 rounded-md min-h-[100px]">
            {words.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No {title.toLowerCase()} configured
              </p>
            ) : (
              words.map((word, index) => (
                <Badge 
                  key={index} 
                  variant={type === "prohibited" ? "secondary" : "destructive"}
                  className="px-2 py-1 flex items-center gap-1"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => removeWord(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Word input */}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type a ${type} word and press Enter...`}
          className="mb-4"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : `Update ${title}`}
      </Button>
    </form>
  );
}