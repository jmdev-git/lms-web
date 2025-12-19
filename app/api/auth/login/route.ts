import { NextRequest } from "next/server";
import { Store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username and password required" }), { status: 400 });
    }

    const result = Store.authenticate(username, password);
    
    if (!result) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }

    // In a real app, we would set a cookie here. 
    // Since the requirement is "Simple session handling (localStorage / sessionStorage)", 
    // we just return the user info and role, and the client handles storage.
    
    const { user, role } = result;
    const { password: _, ...safeUser } = user;

    return Response.json({ success: true, user: safeUser, role });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
