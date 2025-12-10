import { NextResponse } from "next/server";
import OpenAI from "openai";
import { listBooks } from "@/lib/store";

const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o-mini";

function buildSystemPrompt() {
  return [
    "You are an assistant for an LMS web app.",
    "Tasks:",
    "- Help users find books using natural language.",
    "- Explain library rules.",
    "- Guide borrowers on how to borrow and return.",
    "Rules (reflect actual system behavior):",
    "- Loan period is 14 days.",
    "- Borrowers must be active to borrow.",
    "- A book must have available copies to borrow.",
    "- Returning a book immediately increases available copies.",
    "- Overdue means the due date is earlier than today.",
    "Catalog fields available: title, author, category, isbn, availability. No publish year is stored.",
    "Respond ONLY in a single JSON object with keys: intent, criteria, answer.",
    "- intent: one of book_search | rules | borrow_flow | return_flow | general",
    "- criteria: optional object with keys like keywords (string), category (string), author (string)",
    "- answer: a helpful natural-language reply based on these rules",
  ].join("\n");
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const message = (body?.message || "").toString().trim();
  if (!message) {
    return NextResponse.json({ error: "missing_message" }, { status: 400 });
  }

  const token = process.env["GITHUB_TOKEN"];
  if (!token) {
    return NextResponse.json({ error: "missing_github_token" }, { status: 500 });
  }

  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  let plan;
  try {
    const resp = await client.chat.completions.create({
      model: modelName,
      temperature: 0,
      top_p: 1.0,
      max_tokens: 500,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: message },
      ],
    });
    const content = resp?.choices?.[0]?.message?.content || "";
    plan = JSON.parse(content);
  } catch (e) {
    return NextResponse.json({ error: "ai_error", detail: String(e) }, { status: 502 });
  }

  const intent = (plan?.intent || "general").toString();
  const answer = (plan?.answer || "").toString();

  if (intent === "book_search") {
    const books = await listBooks();
    const criteria = plan?.criteria || {};
    const keywords = (criteria?.keywords || "").toString().toLowerCase();
    const category = (criteria?.category || "").toString().toLowerCase();
    const author = (criteria?.author || "").toString().toLowerCase();
    const filtered = books.filter((bk) => {
      const t = (bk.title || "").toLowerCase();
      const a = (bk.author || "").toLowerCase();
      const c = (bk.category || "").toLowerCase();
      const byKw = !keywords
        ? true
        : t.includes(keywords) || a.includes(keywords) || c.includes(keywords) || (bk.isbn || "").toLowerCase().includes(keywords);
      const byCat = !category ? true : c.includes(category);
      const byAuthor = !author ? true : a.includes(author);
      return byKw && byCat && byAuthor;
    });
    return NextResponse.json({ intent, reply: answer, books: filtered });
  }

  if (intent === "rules" || intent === "borrow_flow" || intent === "return_flow" || intent === "general") {
    return NextResponse.json({ intent, reply: answer });
  }

  return NextResponse.json({ intent: "general", reply: answer });
}

