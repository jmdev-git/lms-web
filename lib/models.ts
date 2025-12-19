export interface Borrower {
  id: string;
  memberId: string;
  name: string;
  username: string;
  password?: string; // stored in plaintext as per "simple" requirements, but ideally should be hashed. I'll stick to simple as requested.
  email: string;
  phone?: string;
  registeredAt: string; // ISO date
  role: "borrower" | "admin";
}

export interface Admin {
  username: string;
  password: string;
  role: "admin";
}


export interface Book {
  id: string; // ISBN or internal code
  title: string;
  author: string;
  categories: string[];
  totalCopies: number;
  availableCopies: number;
}

export interface BorrowLog {
  id: string;
  borrowerId: string;
  bookId: string;
  borrowedAt: string; // ISO date
  dueAt: string; // ISO date
  returnedAt?: string; // ISO date
}

export interface ActivitySummary {
  borrower: Borrower;
  activeBorrows: BorrowLog[];
  history: BorrowLog[];
}

