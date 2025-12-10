"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ClientChat() {
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-input bg-card p-6 shadow-sm min-h-56">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className="whitespace-pre-wrap">
              <span className="font-semibold mr-2">{m.role === "user" ? "You:" : "Assistant:"}</span>
              <span>{m.content}</span>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground">Try: Find programming books or explain library rules.</div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Input placeholder="Type your question" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <Button onClick={send} disabled={loading}>{loading ? "Sending..." : "Send"}</Button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}

