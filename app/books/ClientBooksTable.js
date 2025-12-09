"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";

export default function ClientBooksTable({ books }) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const byCategory = !category ? books : books.filter((bk) => bk.category === category);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((bk) => (
      (bk.title || "").toLowerCase().includes(q) ||
      (bk.author || "").toLowerCase().includes(q) ||
      (bk.isbn || "").toLowerCase().includes(q)
    ));
  }, [books, category, query]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input className="sm:col-span-2" placeholder="Search by title, author, ISBN" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div>
          <Select value={category} onValueChange={setCategory} placeholder="All categories">
            <SelectTrigger className="w-full">
              <SelectValue placeholder={category || "All categories"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Categories</SelectLabel>
                <SelectItem value="">All</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-2xl border border-input bg-card p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[35%]" />
              <col className="w-[25%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="bg-muted/40">
              <tr className="text-left text-muted-foreground">
                <th className="py-2 px-2">Title</th>
                <th className="py-2 px-2">Author</th>
                <th className="py-2 px-2">ISBN</th>
                <th className="py-2 px-2">Category</th>
                <th className="py-2 px-2 text-right">Available</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bk) => (
                <tr key={bk.id} className="border-t border-border hover:bg-muted/30">
                  <td className="py-2 px-2 truncate">
                    <span title={bk.title} className="block max-w-[260px]">{bk.title}</span>
                  </td>
                  <td className="py-2 px-2 truncate">
                    <span title={bk.author} className="block max-w-[220px]">{bk.author}</span>
                  </td>
                  <td className="py-2 px-2 font-mono text-xs break-all">{bk.isbn}</td>
                  <td className="py-2 px-2 whitespace-nowrap">{bk.category ?? "-"}</td>
                  <td className="py-2 px-2 text-right">
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs">
                      {bk.copies_available}/{bk.copies_total}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">No books</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
