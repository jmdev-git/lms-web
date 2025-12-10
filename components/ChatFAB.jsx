"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";

export default function ChatFAB() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const prompt = text.trim();
    if (!prompt) return;
    setLoading(true);
    setError("");
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "chat_failed");
      }
      const data = await res.json();
      const parts = [];
      if (data?.reply) parts.push(data.reply);
      if (data?.intent === "book_search" && Array.isArray(data?.books)) {
        if (data.books.length === 0) {
          parts.push("No matching books found.");
        } else {
          parts.push("Matches:");
          parts.push(
            data.books
              .map((bk) => `${bk.title} — ${bk.author} [${bk.category ?? "-"}] • Available ${bk.copies_available}/${bk.copies_total}`)
              .join("\n")
          );
        }
      }
      setMessages((m) => [...m, { role: "assistant", content: parts.join("\n\n") }]);
    } catch (e) {
      setError(String(e.message || e));
    }
    setLoading(false);
    setText("");
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <Button size="icon-lg" className="rounded-full shadow-lg" onClick={() => setOpen(true)} title="Chat">
          <MessageCircle className="size-6" />
        </Button>
      )}
      {open && (
        <div className="w-[340px] sm:w-[400px] rounded-2xl border border-input bg-card shadow-lg">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">Library Assistant</span>
            </div>
            <button className="text-sm text-muted-foreground hover:opacity-80" onClick={() => setOpen(false)}>Close</button>
          </div>
          <div className="p-3">
            <div className="h-[220px] overflow-y-auto space-y-3">
              {messages.map((m, i) => (
                <div key={i} className="whitespace-pre-wrap text-sm">
                  <span className="font-semibold mr-2">{m.role === "user" ? "You:" : "Assistant:"}</span>
                  <span>{m.content}</span>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-xs text-muted-foreground">Ask about books, rules, or borrowing/returning.</div>
              )}
            </div>
            {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
            <div className="mt-3 flex gap-2">
              <Input className="flex-1" placeholder="Type your question" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
              <Button onClick={send} disabled={loading}>{loading ? "Send..." : "Send"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

