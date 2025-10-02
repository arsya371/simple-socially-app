import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="max-w-2xl p-8 text-center space-y-6">
        <div className="mb-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 mx-auto mb-4 text-primary"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <h1 className="text-4xl font-bold tracking-tight">Site Under Maintenance</h1>
        </div>
        
        <p className="text-lg text-muted-foreground">
          We&apos;re currently performing scheduled maintenance on our site. 
          We&apos;ll be back online shortly with improvements to make your experience better.
        </p>
        
        <div className="text-sm text-muted-foreground">
          <p>Expected downtime: A few minutes</p>
          <p>If you&apos;re an administrator, you can still access the admin panel.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/sign-in" className={cn(buttonVariants({ variant: "default" }))}>
            Administrator Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}