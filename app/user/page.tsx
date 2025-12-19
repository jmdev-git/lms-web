"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Book = {
  id: string;
  title: string;
  author: string;
  categories: string[];
  totalCopies: number;
  availableCopies: number;
};

export default function UserPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const prevBooksRef = useRef<Record<string, number>>({});
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatReply, setChatReply] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("lms_role");
    if (!role) {
      router.push("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("lms_user");
    localStorage.removeItem("lms_role");
    router.push("/login");
  }

  useEffect(() => {
    fetch("/api/lms/books", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBooks(d.books));
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

  async function sendChat() {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatInput }),
    });
    const d = await r.json();
    setChatReply(d.reply || "");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-cyan-100 dark:from-black dark:via-zinc-900 dark:to-emerald-900 text-foreground">
      <header className="sticky top-0 z-10 border-b border-emerald-200/50 dark:border-emerald-800/50 bg-white/70 dark:bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Borrower Portal</h1>
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
          <section className="lg:col-span-3">
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
          </section>
          <aside className="lg:col-span-1">
            <button onClick={() => setShowChat((v) => !v)} className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-600 text-white px-5 py-3 shadow-lg hover:bg-emerald-700">Chat</button>
            {showChat && (
              <div className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-black/80 shadow-xl">
                <div className="p-3 border-b border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Chatbot Assistant</span>
                    <button onClick={() => setShowChat(false)} className="text-xs rounded-md px-2 py-1 bg-emerald-600 text-white">Close</button>
                  </div>
                </div>
                <div className="p-3">
                  <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a question..." className="w-full h-24 rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-black/60 border-emerald-300 dark:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  <button onClick={sendChat} className="mt-2 w-full rounded-md bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700">Send</button>
                  {chatReply && (<div className="mt-3 rounded-md border border-emerald-200 dark:border-emerald-800 p-3 text-sm whitespace-pre-wrap bg-white/70 dark:bg-zinc-900/60">{chatReply}</div>)}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
