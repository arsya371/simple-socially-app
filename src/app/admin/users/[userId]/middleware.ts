import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function middleware(request: Request) {
  const session = await auth();

  if (!session?.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Validate userId param for edit routes
  if (request.url.includes("/admin/users/") && request.url.includes("/edit")) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const targetUserId = pathParts[pathParts.indexOf("users") + 1];

    if (!targetUserId) {
      return new NextResponse("Invalid user ID", { status: 400 });
    }
  }

  return NextResponse.next();
}