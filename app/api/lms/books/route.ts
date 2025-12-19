import { NextRequest } from "next/server";
import { Store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { search } = Object.fromEntries(new URL(req.url).searchParams.entries());
  const books = search ? Store.searchBooks(search) : Store.listBooks();
  return Response.json({ books });
}

export async function POST(req: NextRequest) {
  const { id, title, author, categories, totalCopies } = await req.json();
  try {
    const cats = Array.isArray(categories)
      ? categories
      : String(categories || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const book = Store.addBook({ id, title, author, categories: cats, totalCopies: Number(totalCopies) || 0 });
    return Response.json({ book });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
export const dynamic = "force-dynamic";
