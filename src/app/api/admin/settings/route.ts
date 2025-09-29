import { NextResponse } from "next/server";
import { checkRole } from "@/actions/auth.action";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const isAdmin = await checkRole(["ADMIN"]);
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const formData = await req.formData();
    const category = formData.get("category") as string;

    const user = await currentUser();
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user?.id },
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const settings = Object.fromEntries(formData);
    delete settings.category;

    // Update each setting
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: {
            value: value as string,
            updatedBy: dbUser.id,
          },
          create: {
            key,
            value: value as string,
            category,
            updatedBy: dbUser.id,
          },
        })
      )
    );

    return new NextResponse("Settings updated", { status: 200 });
  } catch (error) {
    console.error("Error updating settings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}