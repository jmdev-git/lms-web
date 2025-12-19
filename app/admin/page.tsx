"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Borrower = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registeredAt: string;
};

type Book = {
  id: string;
  title: string;
  author: string;
  categories: string[];
  totalCopies: number;
  availableCopies: number;
};

type BorrowLog = {
  id: string;
  borrowerId: string;
  bookId: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const prevBooksRef = useRef<Record<string, number>>({});
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<BorrowLog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBorrowerId, setSelectedBorrowerId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [borrowCopies, setBorrowCopies] = useState(1);
  const [newBookId, setNewBookId] = useState("");
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookCategories, setNewBookCategories] = useState("");
  const [newBookCopies, setNewBookCopies] = useState(1);
  const [activityView, setActivityView] = useState<"summary"|"details">("summary");
  const [activitySearch, setActivitySearch] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("lms_role");
    if (role !== "admin") {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("lms_user");
    localStorage.removeItem("lms_role");
    router.push("/login");
  }

  useEffect(() => {
    fetch("/api/lms/borrowers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBorrowers(d.borrowers));
    fetch("/api/lms/books", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBooks(d.books));
    fetch("/api/lms/logs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setLogs(d.logs));
  }, []);

  useEffect(() => {
    const prev = prevBooksRef.current;
    const nextFlash = new Set<string>();
    books.forEach((b) => {
      const prevAvail = prev[b.id] ?? b.availableCopies;
      if (prevAvail > 0 && b.availableCopies === 0) {
        nextFlash.add(b.id);
      }
      prev[b.id] = b.availableCopies;
    });
    if (nextFlash.size > 0) {
      const t0 = setTimeout(() => setFlashIds(new Set(nextFlash)), 0);
      const t1 = setTimeout(() => setFlashIds(new Set()), 1000);
      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
      };
    }
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = search.toLowerCase();
    return books.filter((b) => {
      const matchesText =
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.categories.some((c) => c.toLowerCase().includes(q));
      const matchesCategory = selectedCategory
        ? b.categories.map((c) => c.toLowerCase()).includes(selectedCategory.toLowerCase())
        : true;
      return matchesText && matchesCategory;
    });
  }, [books, search, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.categories.forEach((c) => set.add(c)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const borrowerSummaries = useMemo(() => {
    const map = new Map<string, { borrower: Borrower | undefined; active: number; total: number; last: string }>();
    logs.forEach((l) => {
      const existing = map.get(l.borrowerId);
      const borrower = borrowers.find((b) => b.id === l.borrowerId);
      const last = existing ? (new Date(existing.last) < new Date(l.borrowedAt) ? l.borrowedAt : existing.last) : l.borrowedAt;
      map.set(l.borrowerId, {
        borrower,
        active: (existing?.active || 0) + (l.returnedAt ? 0 : 1),
        total: (existing?.total || 0) + 1,
        last,
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      if (b.active !== a.active) return b.active - a.active;
      return new Date(b.last).getTime() - new Date(a.last).getTime();
    });
  }, [logs, borrowers]);

  const groupedDetails = useMemo(() => {
    const map = new Map<string, { key: string; borrower: Borrower | undefined; book: Book | undefined; active: BorrowLog[]; returned: BorrowLog[] }>();
    logs.forEach((l) => {
      const key = `${l.borrowerId}|${l.bookId}`;
      const entry = map.get(key) || {
        key,
        borrower: borrowers.find((b) => b.id === l.borrowerId),
        book: books.find((b) => b.id === l.bookId),
        active: [],
        returned: [],
      };
      if (l.returnedAt) entry.returned.push(l); else entry.active.push(l);
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => (b.active.length - a.active.length) || (a.borrower?.name || "").localeCompare(b.borrower?.name || ""));
  }, [logs, borrowers, books]);

  const [returnCounts, setReturnCounts] = useState<Record<string, number>>({});
  function setCount(key: string, max: number, v: number) {
    const n = Math.min(Math.max(1, v), Math.max(1, max));
    setReturnCounts((prev) => ({ ...prev, [key]: n }));
  }

  async function returnMany(borrowerId: string, bookId: string, count: number) {
    const r = await fetch("/api/lms/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "returnMany", borrowerId, bookId, count }),
    });
    const d = await r.json();
    if (d.logs) {
      fetch("/api/lms/books", { cache: "no-store" }).then((r) => r.json()).then((x) => setBooks(x.books));
      fetch("/api/lms/logs", { cache: "no-store" }).then((r) => r.json()).then((x) => setLogs(x.logs));
    }
  }

  async function borrowSelected() {
    if (!selectedBorrowerId || !selectedBookId) return;
    const r = await fetch("/api/lms/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "borrow",
        borrowerId: selectedBorrowerId,
        bookId: selectedBookId,
        days: 14,
        copies: borrowCopies,
      }),
    });
    const d = await r.json();
    if (d.log || d.logs) {
      const count = d.logs ? d.logs.length : 1;
      setBooks((prev) => prev.map((b) => (b.id === selectedBookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - count) } : b)));
      setSelectedBookId("");
      setBorrowCopies(1);
      fetch("/api/lms/books", { cache: "no-store" }).then((r) => r.json()).then((x) => setBooks(x.books));
      fetch("/api/lms/logs", { cache: "no-store" }).then((r) => r.json()).then((x) => setLogs(x.logs));
    }
  }

  async function returnLog(logId: string) {
    const r = await fetch("/api/lms/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "return", logId }),
    });
    const d = await r.json();
    if (d.log) {
      fetch("/api/lms/books", { cache: "no-store" }).then((r) => r.json()).then((x) => setBooks(x.books));
      fetch("/api/lms/logs", { cache: "no-store" }).then((r) => r.json()).then((x) => setLogs(x.logs));
    }
  }

  async function addBook() {
    const r = await fetch("/api/lms/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newBookId,
        title: newBookTitle,
        author: newBookAuthor,
        categories: newBookCategories,
        totalCopies: newBookCopies,
      }),
    });
    const d = await r.json();
    if (d.book) {
      setNewBookId("");
      setNewBookTitle("");
      setNewBookAuthor("");
      setNewBookCategories("");
      setNewBookCopies(1);
      fetch("/api/lms/books").then((r) => r.json()).then((x) => setBooks(x.books));
    }
  }

  async function deleteBorrower(id: string) {
    const active = logs.some((l) => l.borrowerId === id && !l.returnedAt);
    if (active) return;
    const r = await fetch("/api/lms/borrowers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await r.json();
    if (d.ok) {
      fetch("/api/lms/borrowers").then((r) => r.json()).then((x) => setBorrowers(x.borrowers));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-cyan-100 dark:from-black dark:via-zinc-900 dark:to-emerald-900 text-foreground">
      <header className="sticky top-0 z-10 border-b border-emerald-200/50 dark:border-emerald-800/50 bg-white/70 dark:bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Librarian Admin</h1>
          <div className="flex gap-2 items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books, authors, categories"
              className="rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button onClick={handleLogout} className="rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm">Logout</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black/60 shadow-lg">
              <div className="p-4 border-b border-black/10 dark:border-white/10">
                <h2 className="text-lg font-medium text-emerald-700 dark:text-emerald-300">Book Inventory</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700"
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {selectedCategory && (
                    <button onClick={() => setSelectedCategory("")} className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700">Clear</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">
                  {filteredBooks.map((b) => (
                    <div key={b.id} className={`${b.availableCopies===0?"border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/40":"border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-zinc-900/60"} ${flashIds.has(b.id)?"soldout-flash":""} rounded-2xl border shadow-sm h-full`}>
                      <div className="p-4 flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-base font-semibold leading-tight">{b.title}</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">by {b.author}</p>
                        </div>
                        <span className={`${b.availableCopies>0?"bg-emerald-500":"bg-red-500"} text-white text-xs rounded-full px-2 py-1 whitespace-nowrap`}>
                          {b.availableCopies}/{b.totalCopies} available
                        </span>
                      </div>
                      <div className="px-4 pb-4 flex flex-wrap gap-2">
                        {b.categories.map((c) => (
                          <span key={c} className="text-xs rounded-full px-2 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">{c}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black/60 shadow-lg">
              <div className="p-4 border-b border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-medium text-emerald-700 dark:text-emerald-300">Borrowing Activity</h2>
                <div className="flex items-center gap-2">
                  <input
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    placeholder="Search borrower name..."
                    className="rounded-md border px-3 py-1 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <div className="flex gap-1">
                    <button onClick={()=>setActivityView("summary")} className={`text-xs rounded-md px-3 py-1 ${activityView==="summary"?"bg-emerald-600 text-white":"bg-emerald-100 text-emerald-800"}`}>Summary</button>
                    <button onClick={()=>setActivityView("details")} className={`text-xs rounded-md px-3 py-1 ${activityView==="details"?"bg-emerald-600 text-white":"bg-emerald-100 text-emerald-800"}`}>Details</button>
                  </div>
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                {activityView === "summary" ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2">Borrower</th>
                        <th className="py-2">Active Borrows</th>
                        <th className="py-2">Total Borrows</th>
                        <th className="py-2">Last Activity</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {borrowerSummaries.map((s, idx) => (
                        <tr key={s.borrower?.id || idx} className="border-t border-black/5">
                          <td className="py-2">{s.borrower?.name || s.borrower?.email || "Unknown"}</td>
                          <td className="py-2">{s.active}</td>
                          <td className="py-2">{s.total}</td>
                          <td className="py-2">{new Date(s.last).toLocaleDateString()}</td>
                          <td className="py-2">{s.active > 0 ? (<span className="text-xs rounded-full px-2 py-1 bg-amber-400 text-black">Active</span>) : (<span className="text-xs rounded-full px-2 py-1 bg-emerald-500 text-white">Clear</span>)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2">Borrower</th>
                        <th className="py-2">Book</th>
                        <th className="py-2">Active Count</th>
                        <th className="py-2">Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedDetails.map((g) => {
                        const key = g.key;
                        const activeCount = g.active.length;
                        const val = returnCounts[key] ?? 1;
                        return (
                          <tr key={key} className="border-t border-black/5">
                            <td className="py-2">{g.borrower?.name || g.borrower?.email || key.split("|")[0]}</td>
                            <td className="py-2">{g.book?.title || key.split("|")[1]}</td>
                            <td className="py-2">{activeCount}</td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <input type="number" min={1} max={Math.max(1, activeCount)} value={val} onChange={(e)=>setCount(key, activeCount, parseInt(e.target.value||"1"))} className="w-24 rounded-md border px-3 py-1 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700" />
                                <button onClick={()=>returnMany(key.split("|")[0], key.split("|")[1], val)} disabled={activeCount<1} className="text-xs rounded-md bg-emerald-600 disabled:bg-emerald-300 text-white px-3 py-1 hover:bg-emerald-700">Return</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black/60 shadow-lg">
              <div className="p-4 border-b border-black/10 dark:border-white/10">
                <h2 className="text-lg font-medium text-emerald-700 dark:text-emerald-300">Borrowers</h2>
              </div>
              <div className="p-4 space-y-2">
                {borrowers.map((b) => {
                  const active = logs.some((l) => l.borrowerId === b.id && !l.returnedAt);
                  return (
                    <div key={b.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.name || b.email}</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{new Date(b.registeredAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs rounded-full px-2 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">ID: {b.id.slice(0,8)}</span>
                        <button onClick={() => deleteBorrower(b.id)} disabled={active} className="text-xs rounded-md px-2 py-1 bg-red-500 disabled:bg-red-300 text-white">Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black/60 shadow-lg">
              <div className="p-4 border-b border-black/10 dark:border-white/10">
                <h2 className="text-lg font-medium text-emerald-700 dark:text-emerald-300">Add Book</h2>
              </div>
              <div className="p-4 space-y-2">
                <input value={newBookId} onChange={(e)=>setNewBookId(e.target.value)} placeholder="Book ID / ISBN" className="w-full rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700" />
                <input value={newBookTitle} onChange={(e)=>setNewBookTitle(e.target.value)} placeholder="Title" className="w-full rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700" />
                <input value={newBookAuthor} onChange={(e)=>setNewBookAuthor(e.target.value)} placeholder="Author" className="w-full rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700" />
                <input value={newBookCategories} onChange={(e)=>setNewBookCategories(e.target.value)} placeholder="Categories (comma separated)" className="w-full rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700" />
                <div className="flex items-center gap-3">
                  <input type="number" min={1} value={newBookCopies} onChange={(e)=>setNewBookCopies(parseInt(e.target.value||"1"))} className="w-32 rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">Total copies</span>
                </div>
                <button onClick={addBook} disabled={!newBookId || !newBookTitle || !newBookAuthor || newBookCopies<1} className="w-full rounded-md bg-emerald-600 disabled:bg-emerald-300 text-white px-3 py-2 text-sm hover:bg-emerald-700">Add Book</button>
              </div>
            </div>
            <div className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-black/60 shadow-lg">
              <div className="p-4 border-b border-black/10 dark:border-white/10">
                <h2 className="text-lg font-medium text-emerald-700 dark:text-emerald-300">Borrow Book</h2>
              </div>
              <div className="p-4 space-y-2">
                <select value={selectedBorrowerId} onChange={(e) => setSelectedBorrowerId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700">
                  <option value="">Select borrower</option>
                  {borrowers.map((b) => (<option key={b.id} value={b.id}>{b.name || b.email}</option>))}
                </select>
                <select value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700">
                  <option value="">Select book</option>
                  {books.map((b) => (<option key={b.id} value={b.id}>{b.title}</option>))}
                </select>
                <div className="flex items-center justify-between gap-3">
                  <input type="number" min={1} value={borrowCopies} onChange={(e) => setBorrowCopies(Math.max(1, parseInt(e.target.value || "1")))} className="w-24 rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700" />
                  {selectedBookId && (
                    <span className={`${(books.find((b) => b.id === selectedBookId)?.availableCopies || 0) > 0?"bg-emerald-500 text-white":"bg-red-500 text-white"} text-xs rounded-full px-2 py-1`}>
                      {books.find((b) => b.id === selectedBookId)?.availableCopies || 0} available
                    </span>
                  )}
                </div>
                {selectedBookId && (books.find((b) => b.id === selectedBookId)?.availableCopies || 0) === 0 && (
                  <div className="text-xs text-red-600 dark:text-red-400">This book is unavailable.</div>
                )}
                <button onClick={borrowSelected} disabled={!selectedBorrowerId || !selectedBookId || (books.find((b) => b.id === selectedBookId)?.availableCopies || 0) === 0 || borrowCopies > (books.find((b) => b.id === selectedBookId)?.availableCopies || 0)} className="w-full rounded-md bg-emerald-600 disabled:bg-emerald-300 text-white px-3 py-2 text-sm hover:bg-emerald-700">Borrow</button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

