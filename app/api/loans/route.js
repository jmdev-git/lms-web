import { NextResponse } from "next/server";
import { createLoan, listLoans } from "@/lib/store";

export async function GET() {
  const loans = await listLoans();
  return NextResponse.json(loans);
}

export async function POST(request) {
  const body = await request.json();
  if (!body?.borrower_id || !body?.book_id) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const result = await createLoan(body);
  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json(result.loan);
}
