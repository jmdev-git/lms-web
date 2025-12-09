import { promises as fs } from "fs";
import crypto from "crypto";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");

let queue = Promise.resolve();

async function ensureFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.access(dbPath).catch(async () => {
      const initial = {
        borrowers: [],
        books: [],
        loans: [],
        aliases: []
      };
      await fs.writeFile(dbPath, JSON.stringify(initial, null, 2), "utf8");
    });
  } catch (e) {
    throw e;
  }
}

async function readDB() {
  await ensureFile();
  const raw = await fs.readFile(dbPath, "utf8");
  return JSON.parse(raw || "{}");
}

async function writeDB(db) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

export async function withLock(fn) {
  queue = queue.then(() => fn()).catch((e) => { throw e; });
  return queue;
}

export async function listBorrowers() {
  const db = await readDB();
  return db.borrowers;
}

export async function upsertBorrower(payload) {
  return withLock(async () => {
    const db = await readDB();
    const { first_name, last_name, email, phone, date_of_birth } = payload;
    const existing = db.borrowers.find(
      (b) => (email && b.email === email) || (phone && b.phone === phone)
    );
    if (existing) return existing;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const borrower = {
      id,
      external_id: null,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      status: "active",
      created_at: now,
      updated_at: now
    };
    db.borrowers.push(borrower);
    await writeDB(db);
    return borrower;
  });
}

export async function listBooks() {
  const db = await readDB();
  return db.books;
}

export async function upsertBook(payload) {
  return withLock(async () => {
    const db = await readDB();
    const { isbn, title, author, category, copies_total } = payload;
    let book = db.books.find((b) => b.isbn === isbn);
    const now = new Date().toISOString();
    if (book) {
      book.title = title ?? book.title;
      book.author = author ?? book.author;
      book.category = category ?? book.category;
      if (typeof copies_total === "number") {
        const delta = copies_total - book.copies_total;
        book.copies_total = copies_total;
        book.copies_available = Math.max(
          0,
          Math.min(book.copies_total, book.copies_available + delta)
        );
      }
      book.updated_at = now;
    } else {
      book = {
        id: crypto.randomUUID(),
        isbn,
        title,
        author,
        category: category ?? null,
        copies_total: copies_total ?? 1,
        copies_available: copies_total ?? 1,
        created_at: now,
        updated_at: now
      };
      db.books.push(book);
    }
    await writeDB(db);
    return book;
  });
}

export async function createLoan(payload) {
  return withLock(async () => {
    const db = await readDB();
    const { borrower_id, book_id } = payload;
    const borrower = db.borrowers.find((b) => b.id === borrower_id);
    if (!borrower || borrower.status !== "active") {
      return { error: "borrower_invalid" };
    }
    const book = db.books.find((b) => b.id === book_id);
    if (!book) return { error: "book_not_found" };
    if (book.copies_available <= 0) return { error: "out_of_stock" };
    book.copies_available -= 1;
    book.updated_at = new Date().toISOString();
    const now = new Date();
    const due = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
    const loan = {
      id: crypto.randomUUID(),
      borrower_id,
      book_id,
      loaned_at: now.toISOString(),
      due_at: due.toISOString(),
      returned_at: null,
      status: "active"
    };
    db.loans.push(loan);
    await writeDB(db);
    return { loan, book };
  });
}

export async function returnLoan(loan_id) {
  return withLock(async () => {
    const db = await readDB();
    const loan = db.loans.find((l) => l.id === loan_id && l.returned_at === null);
    if (!loan) return { error: "loan_not_found" };
    const book = db.books.find((b) => b.id === loan.book_id);
    if (!book) return { error: "book_not_found" };
    loan.returned_at = new Date().toISOString();
    loan.status = "returned";
    book.copies_available = Math.min(book.copies_total, book.copies_available + 1);
    book.updated_at = new Date().toISOString();
    await writeDB(db);
    return { loan, book };
  });
}

export async function listLoans() {
  const db = await readDB();
  return db.loans;
}

export async function dashboard() {
  const db = await readDB();
  const borrowerActivity = db.borrowers.map((b) => {
    const active = db.loans.filter((l) => l.borrower_id === b.id && l.returned_at === null);
    const overdue = active.filter((l) => new Date(l.due_at) < new Date());
    const lastActivity = db.loans
      .filter((l) => l.borrower_id === b.id)
      .sort((a, z) => new Date(z.loaned_at) - new Date(a.loaned_at))[0]?.loaned_at;
    return {
      borrower_id: b.id,
      name: `${b.first_name} ${b.last_name}`.trim(),
      active_loans_count: active.length,
      overdue_count: overdue.length,
      last_activity_at: lastActivity ?? b.updated_at
    };
  });
  const bookStatus = db.books.map((bk) => {
    const activeLoans = db.loans.filter((l) => l.book_id === bk.id && l.returned_at === null).length;
    const lastLoan = db.loans
      .filter((l) => l.book_id === bk.id)
      .sort((a, z) => new Date(z.loaned_at) - new Date(a.loaned_at))[0]?.loaned_at;
    return {
      book_id: bk.id,
      title: bk.title,
      copies_available: bk.copies_available,
      active_loans_count: activeLoans,
      last_loan_at: lastLoan ?? bk.updated_at
    };
  });
  const activeLoans = db.loans.filter((l) => l.returned_at === null);
  const overdueLoans = activeLoans.filter((l) => new Date(l.due_at) < new Date());
  const summary = {
    totalBorrowers: db.borrowers.length,
    totalBooks: db.books.length,
    activeLoans: activeLoans.length,
    overdueLoans: overdueLoans.length
  };
  return { borrowerActivity, bookStatus, summary };
}

// resetDB removed per request

