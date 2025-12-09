import { BorrowForm, ReturnButton } from "./ClientLoan";
import { listBorrowers, listBooks, listLoans } from "@/lib/store";

export default async function LoansPage() {
  const [borrowers, books, loans] = await Promise.all([
    listBorrowers(),
    listBooks(),
    listLoans(),
  ]);
  const active = loans.filter((l) => l.returned_at === null);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Loans</h1>
        <p className="text-sm text-muted-foreground">
          Borrow and return books; view active loans.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <BorrowForm borrowers={borrowers} books={books} />
        <div className="rounded-2xl border border-input bg-card p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Loan ID</th>
                  <th className="py-2">Borrower</th>
                  <th className="py-2">Book</th>
                  <th className="py-2">Due</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {active.map((l) => {
                  const b = borrowers.find((x) => x.id === l.borrower_id);
                  const bk = books.find((x) => x.id === l.book_id);
                  return (
                    <tr key={l.id} className="border-t border-border">
                      <td className="py-2">{l.id}</td>
                      <td className="py-2">
                        {b ? `${b.first_name} ${b.last_name}` : ""}
                      </td>
                      <td className="py-2">{bk ? bk.title : ""}</td>
                      <td className="py-2">
                        {new Date(l.due_at).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        <ReturnButton id={l.id} />
                      </td>
                    </tr>
                  );
                })}
                {active.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No active loans
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
