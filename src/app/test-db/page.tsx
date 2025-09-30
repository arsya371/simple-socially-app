import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";

export default async function TestDbPage() {
  try {
    // Test basic database connection
    const userCount = await prisma.user.count();
    
    // Test AppSetting operations
    const existingSettings = await prisma.appSetting.findMany();
    
    // Try to create a test setting
    const testSetting = await prisma.appSetting.upsert({
      where: { key: 'test_setting' },
      update: { value: 'updated_value' },
      create: {
        key: 'test_setting',
        value: 'test_value',
        type: 'STRING',
        category: 'test',
        description: 'Test setting',
        isPublic: false,
        updatedBy: 'test-user-id'
      }
    });
    
    return (
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Database Test</h1>
        
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
            <p className="text-green-600">✅ Database connection successful</p>
            <p>User count: {userCount}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">App Settings Test</h2>
            <p>Existing settings count: {existingSettings.length}</p>
            <p>Test setting created: {testSetting.key} = {testSetting.value}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">All App Settings</h2>
            <div className="space-y-2">
              {existingSettings.map((setting) => (
                <div key={setting.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-mono text-sm">{setting.key}</span>
                  <span className="text-sm">{setting.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Database Error</h1>
          <p className="text-red-500 mb-4">{error.message}</p>
          <pre className="bg-muted p-4 rounded text-sm overflow-auto">
            {error.stack}
          </pre>
        </Card>
      </div>
    );
  }
}
