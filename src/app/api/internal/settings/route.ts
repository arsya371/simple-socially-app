import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

// This route needs to run on the server, not the edge
export const runtime = "nodejs";

export async function GET(request: Request) {
  const headersList = headers();
  const isInternalRequest = headersList.get("x-internal-request") === process.env.INTERNAL_SECRET;
  
  // Only allow internal requests from our middleware
  if (!isInternalRequest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [maintenanceMode, userRegistration] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "maintenanceMode" }}),
      prisma.setting.findUnique({ where: { key: "userRegistration" }}),
    ]);

    return NextResponse.json({
      maintenanceMode: maintenanceMode?.value === "true",
      userRegistration: userRegistration?.value === "true",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking settings:", error);
    return NextResponse.json({ 
      error: "Failed to check settings",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}