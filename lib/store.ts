import { Borrower, Book, BorrowLog, ActivitySummary, Admin } from "./models";

type InternalStore = {
  borrowers: Map<string, Borrower>;
  borrowerByEmail: Map<string, string>;
  borrowerByUsername: Map<string, string>;
  books: Map<string, Book>;
  logs: Map<string, BorrowLog>;
};

declare global {
  // eslint-disable-next-line no-var
  var __LMS_STORE__: InternalStore | undefined;
}

function isoNow() {
  return new Date().toISOString();
}

const internal = globalThis.__LMS_STORE__ ?? {
  borrowers: new Map<string, Borrower>(),
  borrowerByEmail: new Map<string, string>(),
  borrowerByUsername: new Map<string, string>(),
  books: new Map<string, Book>(),
  logs: new Map<string, BorrowLog>(),
};
globalThis.__LMS_STORE__ = internal;

const borrowers = internal.borrowers;
const borrowerByEmail = internal.borrowerByEmail;
const borrowerByUsername = internal.borrowerByUsername;
const books = internal.books;
const logs = internal.logs;

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// Predefined Admins
const ADMINS: Admin[] = [
  { username: "admin", password: "adminpassword", role: "admin" }
];

// Seed sample data for demo (only when empty)
(() => {
  if (books.size > 0) return;
  const b1: Book = {
    id: "9780140449136",
    title: "The Odyssey",
    author: "Homer",
    categories: ["Classic", "Epic"],
    totalCopies: 4,
    availableCopies: 4,
  };
  const b2: Book = {
    id: "9780061120084",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    categories: ["Fiction", "Classic"],
    totalCopies: 5,
    availableCopies: 5,
  };
  const b3: Book = {
    id: "9780262033848",
    title: "Introduction to Algorithms",
    author: "Cormen, Leiserson, Rivest, Stein",
    categories: ["Computer Science", "Algorithms"],
    totalCopies: 2,
    availableCopies: 2,
  };
  books.set(b1.id, b1);
  books.set(b2.id, b2);
  books.set(b3.id, b3);
})();

export const Store = {
  registerBorrower(input: { name: string; memberId: string; username: string; password: string; email: string; phone?: string }): Borrower {
    const existingIdByEmail = borrowerByEmail.get(input.email.toLowerCase());
    if (existingIdByEmail) throw new Error("Email already registered");

    const existingIdByUsername = borrowerByUsername.get(input.username.toLowerCase());
    if (existingIdByUsername) throw new Error("Username already taken");

    const id = uid("user");
    const borrower: Borrower = {
      id,
      memberId: input.memberId,
      name: input.name,
      username: input.username,
      password: input.password,
      email: input.email,
      phone: input.phone,
      registeredAt: isoNow(),
      role: "borrower"
    };
    borrowers.set(id, borrower);
    borrowerByEmail.set(input.email.toLowerCase(), id);
    borrowerByUsername.set(input.username.toLowerCase(), id);
    return borrower;
  },

  authenticate(identifier: string, password: string): { user: Borrower | Admin; role: "admin" | "borrower" } | null {
    // Check Admins
    const admin = ADMINS.find(a => a.username === identifier && a.password === password);
    if (admin) {
      return { user: admin, role: "admin" };
    }

    // Check Borrowers by username or email
    const idByUsername = borrowerByUsername.get(identifier.toLowerCase());
    const idByEmail = borrowerByEmail.get(identifier.toLowerCase());
    
    const borrowerId = idByUsername || idByEmail;

    if (borrowerId) {
      const borrower = borrowers.get(borrowerId);
      if (borrower && borrower.password === password) {
        return { user: borrower, role: "borrower" };
      }
    }
    return null;
  },

  removeBorrower(id: string): void {
    const hasActive = Array.from(logs.values()).some((l) => l.borrowerId === id && !l.returnedAt);
    if (hasActive) throw new Error("Borrower has active borrows");
    const borrower = borrowers.get(id);
    if (!borrower) throw new Error("Borrower not found");
    borrowers.delete(id);
    borrowerByEmail.delete(borrower.email.toLowerCase());
    borrowerByUsername.delete(borrower.username.toLowerCase());
  },

  listBorrowers(): Borrower[] {
    return Array.from(borrowers.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  listBooks(): Book[] {
    return Array.from(books.values()).sort((a, b) => a.title.localeCompare(b.title));
  },

  findBook(id: string): Book | undefined {
    return books.get(id);
  },

  addBook(input: { id: string; title: string; author: string; categories: string[]; totalCopies: number }): Book {
    if (books.has(input.id)) throw new Error("Book already exists");
    const book: Book = {
      id: input.id,
      title: input.title,
      author: input.author,
      categories: input.categories,
      totalCopies: input.totalCopies,
      availableCopies: input.totalCopies,
    };
    books.set(book.id, book);
    return book;
  },

  searchBooks(query: string): Book[] {
    const q = query.toLowerCase();
    return this.listBooks().filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.categories.some((c) => c.toLowerCase().includes(q))
    );
  },

  borrowBook(borrowerId: string, bookId: string, days = 14): BorrowLog {
    const book = books.get(bookId);
    if (!book) throw new Error("Book not found");
    if (book.availableCopies <= 0) throw new Error("Book not available");
    const borrowedAt = new Date();
    const dueAt = new Date(borrowedAt.getTime() + days * 24 * 60 * 60 * 1000);
    const log: BorrowLog = {
      id: uid("log"),
      borrowerId,
      bookId,
      borrowedAt: borrowedAt.toISOString(),
      dueAt: dueAt.toISOString(),
    };
    logs.set(log.id, log);
    book.availableCopies -= 1;
    books.set(bookId, book);
    return log;
  },

  borrowBooks(borrowerId: string, bookId: string, count = 1, days = 14): BorrowLog[] {
    const book = books.get(bookId);
    if (!book) throw new Error("Book not found");
    if (count < 1) throw new Error("Count must be at least 1");
    if (book.availableCopies < count) throw new Error("Not enough copies available");
    const out: BorrowLog[] = [];
    for (let i = 0; i < count; i++) {
      const borrowedAt = new Date();
      const dueAt = new Date(borrowedAt.getTime() + days * 24 * 60 * 60 * 1000);
      const log: BorrowLog = {
        id: uid("log"),
        borrowerId,
        bookId,
        borrowedAt: borrowedAt.toISOString(),
        dueAt: dueAt.toISOString(),
      };
      logs.set(log.id, log);
      out.push(log);
    }
    book.availableCopies -= count;
    books.set(bookId, book);
    return out;
  },

  returnBook(logId: string): BorrowLog {
    const log = logs.get(logId);
    if (!log) throw new Error("Borrow log not found");
    if (log.returnedAt) return log;
    log.returnedAt = isoNow();
    const book = books.get(log.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      books.set(book.id, book);
    }
    logs.set(log.id, log);
    return log;
  },

  returnBooks(borrowerId: string, bookId: string, count: number): BorrowLog[] {
    const active = Array.from(logs.values()).filter(l => l.borrowerId === borrowerId && l.bookId === bookId && !l.returnedAt);
    if (active.length < count) throw new Error("Not enough active borrows to return");
    
    const toReturn = active.slice(0, count);
    const returnedLogs: BorrowLog[] = [];
    
    // We can just call returnBook for each
    for (const log of toReturn) {
      returnedLogs.push(this.returnBook(log.id));
    }
    return returnedLogs;
  },

  borrowerActivity(borrowerId: string): ActivitySummary {
    const borrower = borrowers.get(borrowerId);
    if (!borrower) throw new Error("Borrower not found");
    const history = Array.from(logs.values()).filter((l) => l.borrowerId === borrowerId);
    const activeBorrows = history.filter((l) => !l.returnedAt);
    return { borrower, activeBorrows, history };
  },

  listLogs(): BorrowLog[] {
    return Array.from(logs.values()).sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt));
  },
};
