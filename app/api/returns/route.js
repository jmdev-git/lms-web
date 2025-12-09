import { NextResponse } from "next/server";
import { returnLoan } from "@/lib/store";

export async function POST(request) {
  const body = await request.json();
  if (!body?.loan_id) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await returnLoan(body.loan_id);
  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result.loan);
}
