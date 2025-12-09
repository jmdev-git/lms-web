import ClientBook from "./ClientBook";
import ClientBooksTable from "./ClientBooksTable";

export default async function BooksPage() {
  const res = await fetch("http://localhost:3000/api/books", {
    cache: "no-store",
  });
  const books = await res.json();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Books</h1>
        <p className="text-sm text-muted-foreground">
          Catalog titles and monitor availability.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <ClientBook />
        <ClientBooksTable books={books} />
      </div>
    </div>
  );
}
