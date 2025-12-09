import { NextResponse } from "next/server";
import { listBorrowers, upsertBorrower } from "@/lib/store";

export async function GET() {
  const borrowers = await listBorrowers();
  return NextResponse.json(borrowers);
}

export async function POST(request) {
  const body = await request.json();
  const required = ["first_name", "last_name", "email", "phone", "date_of_birth"];
  const missing = required.filter((k) => !body?.[k]);
  if (missing.length) {
    return NextResponse.json({ error: "missing_fields", fields: missing }, { status: 400 });
  }
  const borrower = await upsertBorrower(body);
  return NextResponse.json(borrower);
}
