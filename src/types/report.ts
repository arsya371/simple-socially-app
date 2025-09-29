import { Report } from "@prisma/client";

export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
export type ReportType = "POST" | "COMMENT" | "PROFILE";

export interface ReportWithRelations extends Omit<Report, "status" | "type"> {
  status: ReportStatus;
  type: ReportType;
  reporter: { username: string };
  post?: {
    id: string;
    content: string | null;
    image: string | null;
    createdAt: Date;
    author: { username: string };
  } | null;
  comment?: {
    id: string;
    content: string;
    author: { username: string };
  } | null;
  reportedUser?: {
    id: string;
    username: string;
    email: string;
    bio: string | null;
  } | null;
}