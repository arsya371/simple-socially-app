import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ModeratorReportsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reports Management</CardTitle>
          <CardDescription>
            Review and handle user reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-96">
            <p>Loading reports management interface...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}