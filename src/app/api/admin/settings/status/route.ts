import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
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