"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ClientBorrower() {
  const router = useRouter();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", date_of_birth: "" });
  const [error, setError] = useState("");

  async function submit() {
    const { first_name, last_name, email, phone, date_of_birth } = form;
    if (!first_name || !last_name || !email || !phone || !date_of_birth) {
      setError("All fields are required");
      return;
    }
    setError("");
    const res = await fetch("/api/borrowers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      try {
        const data = await res.json();
        setError(data?.error || "save_failed");
      } catch {
        setError("save_failed");
      }
      return;
    }
    setForm({ first_name: "", last_name: "", email: "", phone: "", date_of_birth: "" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white dark:bg-black space-y-3">
      <h2 className="text-xl font-medium">Register Borrower</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <Input placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input type="date" max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
      </div>
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button onClick={submit} disabled={!form.first_name || !form.last_name || !form.email || !form.phone || !form.date_of_birth}>Save</Button>
    </div>
  );
}
