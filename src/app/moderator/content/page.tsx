import ReportsTable from "@/components/moderator/ReportsTable";

export default function ModeratorContentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Content Moderation</h1>
      <p className="text-muted-foreground">Review and manage reported content</p>
      
      <ReportsTable />
    </div>
  );
}