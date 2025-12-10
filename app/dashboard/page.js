import { Users, Book, HandCoins, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const [dashboardRes] = await Promise.all([
    fetch(`${(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "")}/api/dashboard`, { cache: "no-store" }),
  ]);
  const dashboard = await dashboardRes.json();
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold uppercase/5 text-white/80">Borrowers</div>
              <div className="text-3xl font-semibold">{dashboard.summary.totalBorrowers}</div>
            </div>
            <Users className="size-8 text-white/80" />
          </div>
        </div>
        <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-emerald-600 to-teal-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold uppercase/5 text-white/80">Books</div>
              <div className="text-3xl font-semibold">{dashboard.summary.totalBooks}</div>
            </div>
            <Book className="size-8 text-white/80" />
          </div>
        </div>
        <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-violet-600 to-fuchsia-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold uppercase/5 text-white/80">Active Loans</div>
              <div className="text-3xl font-semibold">{dashboard.summary.activeLoans}</div>
            </div>
            <HandCoins className="size-8 text-white/80" />
          </div>
        </div>
        <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-rose-600 to-red-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold uppercase/5 text-white/80">Overdue</div>
              <div className="text-3xl font-semibold">{dashboard.summary.overdueLoans}</div>
            </div>
            <AlertTriangle className="size-8 text-white/80" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-8">
        <div className="rounded-2xl col-span-2 border border-input bg-card p-6 shadow-sm">
          <h2 className="text-xl font-medium mb-4">Borrower Activity</h2>
          <ul className="divide-y">
            {dashboard.borrowerActivity.map((b) => (
              <li key={b.borrower_id} className="py-3 flex justify-between">
                <span>{b.name}</span>
                <span className="text-sm text-muted-foreground">Active {b.active_loans_count} • Overdue {b.overdue_count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl col-span-3 border border-input bg-card p-6 shadow-sm">
          <h2 className="text-xl font-medium mb-4">Book Status</h2>
          <ul className="divide-y">
            {dashboard.bookStatus.map((bk) => (
              <li key={bk.book_id} className="py-3 flex justify-between">
                <span title={bk.title} className="line-clamp-1 w-92">{bk.title}</span>
                <span className="text-sm text-muted-foreground">Available {bk.copies_available} • Active {bk.active_loans_count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
