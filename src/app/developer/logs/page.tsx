import SystemMetrics from "@/components/developer/SystemMetrics";

export default function DeveloperLogsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">System Logs & Metrics</h1>
      <SystemMetrics />
    </div>
  );
}