import { NextResponse } from "next/server";
import { listBooks, upsertBook } from "@/lib/store";

export async function GET() {
  const books = await listBooks();
  return NextResponse.json(books);
}

export async function POST(request) {
  const body = await request.json();
  const required = ["isbn", "title", "author", "category", "copies_total"];
  const missing = required.filter((k) => !body?.[k] && body?.[k] !== 0);
  if (missing.length || (typeof body?.copies_total !== "number") || body?.copies_total <= 0) {
    return NextResponse.json({ error: "missing_fields", fields: missing }, { status: 400 });
  }
  const book = await upsertBook(body);
  return NextResponse.json(book);
}
