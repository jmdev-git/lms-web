import ClientBorrower from "./ClientBorrower";

export default async function BorrowersPage() {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const res = await fetch(`${base}/api/borrowers`, { cache: "no-store" });
  const borrowers = await res.json();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Borrowers</h1>
        <p className="text-sm text-muted-foreground">Manage registrations and view borrower details.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-input bg-card p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {borrowers.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="py-2">{b.first_name} {b.last_name}</td>
                    <td className="py-2">{b.email}</td>
                    <td className="py-2">{b.phone}</td>
                  </tr>
                ))}
                {borrowers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">No borrowers</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-input bg-card p-6 shadow-sm">
          <ClientBorrower />
        </div>
      </div>
    </div>
  );
}
