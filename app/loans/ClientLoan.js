"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BorrowForm({ borrowers, books }) {
  const router = useRouter();
  const [form, setForm] = useState({ borrower_id: "", book_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const booksAvailable = books.filter((bk) => (bk.copies_available ?? 0) > 0);
  async function submit() {
    if (!form.borrower_id || !form.book_id) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      try {
        const data = await res.json();
        setError(data?.error || "loan_failed");
      } catch {
        setError("loan_failed");
      }
    } else {
      setForm({ borrower_id: "", book_id: "" });
    }
    setLoading(false);
    router.refresh();
  }
  return (
    <div className="rounded-2xl border border-input bg-card p-6 shadow-sm space-y-3">
      <h2 className="text-xl font-medium">Borrow</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select value={form.borrower_id} onValueChange={(v) => setForm({ ...form, borrower_id: v })} placeholder="Select borrower">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select borrower" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Borrowers</SelectLabel>
              {borrowers.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.first_name} {b.last_name}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={form.book_id} onValueChange={(v) => setForm({ ...form, book_id: v })} placeholder="Select book">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select book" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Books</SelectLabel>
              {booksAvailable.map((bk) => (
                <SelectItem key={bk.id} value={bk.id}>{bk.title} ({bk.copies_available} available)</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button onClick={submit} disabled={loading || !form.borrower_id || !form.book_id}>
        {loading ? "Processing..." : "Borrow"}
      </Button>
    </div>
  );
}

export function ReturnButton({ id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true);
    const res = await fetch("/api/returns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loan_id: id }) });
    setLoading(false);
    if (!res.ok) return;
    router.refresh();
  }
  return (
    <Button size="sm" onClick={submit} disabled={loading}>{loading ? "Returning..." : "Return"}</Button>
  );
}
