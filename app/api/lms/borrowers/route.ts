import { NextRequest } from "next/server";
import { Store } from "@/lib/store";

export async function GET() {
  return Response.json({ borrowers: Store.listBorrowers() });
}

export async function POST(req: NextRequest) {
  const { name, email, phone, memberId, username, password } = await req.json();
  try {
    if (!name || !email || !memberId || !username || !password) {
       throw new Error("Missing required fields");
    }
    const b = Store.registerBorrower({ name, email, phone, memberId, username, password });
    return Response.json({ borrower: b });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    Store.removeBorrower(id);
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
export const dynamic = "force-dynamic";
