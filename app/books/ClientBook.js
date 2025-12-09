"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";

export default function ClientBook() {
  const router = useRouter();
  const [form, setForm] = useState({ isbn: "", title: "", author: "", category: "", copies_total: 1 });
  const [error, setError] = useState("");

  async function submit() {
    const { isbn, title, author, category, copies_total } = form;
    if (!isbn || !title || !author || !category || !copies_total || copies_total <= 0) {
      setError("All fields are required");
      return;
    }
    setError("");
    const res = await fetch("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      try {
        const data = await res.json();
        setError(data?.error || "save_failed");
      } catch {
        setError("save_failed");
      }
      return;
    }
    setForm({ isbn: "", title: "", author: "", category: "", copies_total: 1 });
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-input bg-card p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-medium">Catalog Book</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} placeholder="Select category">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Categories</SelectLabel>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input type="number" placeholder="Copies" value={form.copies_total} onChange={(e) => setForm({ ...form, copies_total: Number(e.target.value) })} />
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <div className="flex justify-end">
        <Button onClick={submit} disabled={!form.isbn || !form.title || !form.author || !form.category || !form.copies_total || form.copies_total <= 0}>Save</Button>
      </div>
    </div>
  );
}
