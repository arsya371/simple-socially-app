import { NextResponse } from "next/server";
import { getAppSetting } from "@/lib/app-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const live = await getAppSetting('website_live', true);
    return NextResponse.json({ live }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ live: true }, { status: 200 });
  }
}


