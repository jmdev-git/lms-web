import { NextRequest } from "next/server";
import { Store } from "@/lib/store";

export async function GET() {
  return Response.json({ logs: Store.listLogs() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type } = body;
  try {
    if (type === "borrow") {
      const { borrowerId, bookId, days, copies } = body;
      const count = Number(copies) || 1;
      if (count > 1) {
        const logs = Store.borrowBooks(borrowerId, bookId, count, days);
        return Response.json({ logs });
      }
      const log = Store.borrowBook(borrowerId, bookId, days);
      return Response.json({ log });
    }
    if (type === "return") {
      const { logId } = body;
      const log = Store.returnBook(logId);
      return Response.json({ log });
    }
    if (type === "returnMany") {
      const { borrowerId, bookId, count } = body;
      const logs = Store.returnBooks(borrowerId, bookId, Number(count));
      return Response.json({ logs });
    }
    return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
export const dynamic = "force-dynamic";
