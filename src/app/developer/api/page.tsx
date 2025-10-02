import SystemMetrics from "@/components/developer/SystemMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeveloperApiPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">API Management</h1>
      <p className="text-muted-foreground">Monitor and manage API performance and metrics</p>
      
      <SystemMetrics />

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>Available endpoints and usage guidelines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Authentication</h3>
              <p className="text-sm text-muted-foreground">All API endpoints require authentication via Bearer token</p>
            </div>
            <div>
              <h3 className="font-semibold">Rate Limiting</h3>
              <p className="text-sm text-muted-foreground">100 requests per minute per API key</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}