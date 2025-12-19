import { NextRequest } from "next/server";
import { Store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { name, memberId, username, password, email, phone } = await req.json();
    
    // Basic validation
    if (!name || !memberId || !username || !password || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const borrower = Store.registerBorrower({ name, memberId, username, password, email, phone });
    
    // Don't return the password
    const { password: _, ...safeBorrower } = borrower;
    
    return Response.json({ success: true, user: safeBorrower });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
