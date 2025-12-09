import { NextResponse } from "next/server";
import { dashboard } from "@/lib/store";

export async function GET() {
  const data = await dashboard();
  return NextResponse.json(data);
}

