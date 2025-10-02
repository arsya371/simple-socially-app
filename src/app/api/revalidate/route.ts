import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-middleware";
import { withLogging } from "@/lib/api-wrapper";

export const dynamic = 'force-dynamic';

export const GET = withLogging(async (request: NextRequest) => {
  const auth = await checkAdminAuth();
  
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error?.includes("sign in") ? 401 : 403 }
    );
  }

  const path = request.nextUrl.searchParams.get("path") || "/";
  revalidatePath(path);
  
  return NextResponse.json({ revalidated: true, now: Date.now() });
});