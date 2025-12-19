import { NextRequest } from "next/server";
import OpenAI from "openai";
import { Store } from "@/lib/store";

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o-mini";

const client = new OpenAI({ baseURL: endpoint || undefined, apiKey: token });

function makeSystemPrompt() {
  return `You are the community library assistant.\n` +
    `Capabilities: answer book availability, categories; guide registration, borrowing, returning; ` +
    `send overdue reminders; provide real-time status of borrowed books and user activity.`;
}

export async function POST(req: NextRequest) {
  const { message, borrowerEmail } = await req.json();
  const borrower = borrowerEmail ? Store.registerBorrower(borrowerEmail, borrowerEmail) : undefined;

  // Lightweight context injection
  const books = Store.listBooks();
  const active = borrower ? Store.borrowerActivity(borrower.id).activeBorrows : [];

  const context = `Books: ${books.map(b=>`${b.title} (${b.availableCopies}/${b.totalCopies})`).join("; ")}. ` +
    (borrower ? `Borrower active: ${active.map(l=>`${l.bookId} due ${l.dueAt}`).join(", ") || "none"}. ` : "");

  const response = await client.chat.completions.create({
    messages: [
      { role: "system", content: makeSystemPrompt() },
      { role: "user", content: `${context}\nUser: ${message}` },
    ],
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 600,
    model: modelName,
  });

  return Response.json({ reply: response.choices[0].message.content });
}

