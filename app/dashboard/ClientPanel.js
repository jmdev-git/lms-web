"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientPanel({ borrowers, books, loans }) {
  const router = useRouter();
  const [borrowerForm, setBorrowerForm] = useState({ first_name: "", last_name: "", email: "", phone: "", date_of_birth: "" });
  const [bookForm, setBookForm] = useState({ isbn: "", title: "", author: "", copies_total: 1 });
  const [loanForm, setLoanForm] = useState({ borrower_id: "", book_id: "" });
  const activeLoans = loans.filter((l) => l.returned_at === null);

  async function createBorrower() {
    await fetch("/api/borrowers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(borrowerForm) });
    setBorrowerForm({ first_name: "", last_name: "", email: "", phone: "", date_of_birth: "" });
    router.refresh();
  }

  async function createBook() {
    await fetch("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bookForm) });
    setBookForm({ isbn: "", title: "", author: "", copies_total: 1 });
    router.refresh();
  }

  async function createLoan() {
    const res = await fetch("/api/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loanForm) });
    if (!res.ok) {
      alert("Loan failed");
    }
    setLoanForm({ borrower_id: "", book_id: "" });
    router.refresh();
  }

  async function performReturn(id) {
    const res = await fetch("/api/returns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loan_id: id }) });
    if (!res.ok) {
      alert("Return failed");
    }
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h2 className="text-xl font-medium">Register Borrower</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2" placeholder="First name" value={borrowerForm.first_name} onChange={(e) => setBorrowerForm({ ...borrowerForm, first_name: e.target.value })} />
          <input className="border p-2" placeholder="Last name" value={borrowerForm.last_name} onChange={(e) => setBorrowerForm({ ...borrowerForm, last_name: e.target.value })} />
          <input className="border p-2" placeholder="Email" value={borrowerForm.email} onChange={(e) => setBorrowerForm({ ...borrowerForm, email: e.target.value })} />
          <input className="border p-2" placeholder="Phone" value={borrowerForm.phone} onChange={(e) => setBorrowerForm({ ...borrowerForm, phone: e.target.value })} />
          <input className="border p-2" placeholder="Date of birth" value={borrowerForm.date_of_birth} onChange={(e) => setBorrowerForm({ ...borrowerForm, date_of_birth: e.target.value })} />
        </div>
        <button className="bg-black text-white px-4 py-2" onClick={createBorrower}>Save</button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium">Catalog Book</h2>
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2" placeholder="ISBN" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
          <input className="border p-2" placeholder="Title" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
          <input className="border p-2" placeholder="Author" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
          <input className="border p-2" type="number" placeholder="Copies" value={bookForm.copies_total} onChange={(e) => setBookForm({ ...bookForm, copies_total: Number(e.target.value) })} />
        </div>
        <button className="bg-black text-white px-4 py-2" onClick={createBook}>Save</button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium">Borrow</h2>
        <div className="grid grid-cols-2 gap-2">
          <select className="border p-2" value={loanForm.borrower_id} onChange={(e) => setLoanForm({ ...loanForm, borrower_id: e.target.value })}>
            <option value="">Select borrower</option>
            {borrowers.map((b) => (
              <option key={b.id} value={b.id}>{b.first_name} {b.last_name}</option>
            ))}
          </select>
          <select className="border p-2" value={loanForm.book_id} onChange={(e) => setLoanForm({ ...loanForm, book_id: e.target.value })}>
            <option value="">Select book</option>
            {books.map((bk) => (
              <option key={bk.id} value={bk.id}>{bk.title}</option>
            ))}
          </select>
        </div>
        <button className="bg-black text-white px-4 py-2" onClick={createLoan}>Borrow</button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-medium">Active Loans</h2>
        <ul className="divide-y">
          {activeLoans.map((l) => (
            <li key={l.id} className="py-2 flex items-center justify-between">
              <span className="text-sm">{l.id}</span>
              <button className="bg-black text-white px-3 py-1" onClick={() => performReturn(l.id)}>Return</button>
            </li>
          ))}
          {activeLoans.length === 0 && <li className="py-2 text-sm text-zinc-500">No active loans</li>}
        </ul>
      </div>
    </div>
  );
}
