"use client";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const show = pathname === "/dashboard" || pathname === "/borrowers" || pathname === "/books" || pathname === "/loans";
  if (!show) return null;
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-secondary text-secondary-foreground">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold">LMS</a>
        <nav className="flex items-center gap-2">
          <a href="/dashboard" className="text-sm px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90">Dashboard</a>
          <a href="/borrowers" className="text-sm px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90">Borrowers</a>
          <a href="/books" className="text-sm px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90">Books</a>
          <a href="/loans" className="text-sm px-3 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90">Loans</a>
        </nav>
      </div>
    </header>
  );
}

