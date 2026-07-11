import type { Category, Transaction, TransactionWithCategory } from './types';
import { dummyCategories } from '@/data/categories';
import { dummyTransactions } from '@/data/transactions';

type Listener = () => void;

let categories: Category[] = [...dummyCategories];
let transactions: TransactionWithCategory[] = [...dummyTransactions];
let listeners: Listener[] = [];

// Cached snapshots for useSyncExternalStore — must return the same reference
// across calls unless the underlying data actually changed.
let categoriesSnapshot: Category[] = [...categories].sort((a, b) =>
  a.created_at.localeCompare(b.created_at)
);
let transactionsSnapshot: TransactionWithCategory[] = [...transactions].sort((a, b) =>
  b.date.localeCompare(a.date)
);

function rebuildSnapshots() {
  categoriesSnapshot = [...categories].sort((a, b) => a.created_at.localeCompare(b.created_at));
  transactionsSnapshot = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
}

function notify() {
  rebuildSnapshots();
  listeners.forEach((l) => l());
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function attachCategory(txn: Transaction): TransactionWithCategory {
  const category = categories.find((c) => c.id === txn.category_id);
  if (!category) throw new Error(`Category not found for transaction ${txn.id}`);
  return { ...txn, category };
}

export const dummyStore = {
  subscribe(listener: Listener): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  getCategories(): Category[] {
    return categoriesSnapshot;
  },

  getTransactions(): TransactionWithCategory[] {
    return transactionsSnapshot;
  },

  createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Category {
    const now = new Date().toISOString();
    const category: Category = {
      ...data,
      id: generateId('cat'),
      created_at: now,
      updated_at: now,
    };
    categories = [...categories, category];
    notify();
    return category;
  },

  updateCategory(id: string, data: Partial<Category>): Category {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    const updated: Category = {
      ...categories[idx],
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    categories = categories.map((c) => (c.id === id ? updated : c));
    transactions = transactions.map((t) =>
      t.category_id === id ? { ...t, category: updated } : t
    );
    notify();
    return updated;
  },

  deleteCategory(id: string): void {
    categories = categories.filter((c) => c.id !== id);
    transactions = transactions.filter((t) => t.category_id !== id);
    notify();
  },

  createTransaction(data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): TransactionWithCategory {
    const now = new Date().toISOString();
    const txn: Transaction = {
      ...data,
      id: generateId('txn'),
      created_at: now,
      updated_at: now,
    };
    const withCategory = attachCategory(txn);
    transactions = [withCategory, ...transactions];
    notify();
    return withCategory;
  },

  updateTransaction(id: string, data: Partial<Transaction>): TransactionWithCategory {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Transaction not found');
    const { category: _category, ...txnFields } = data;
    const updated: Transaction = {
      ...transactions[idx],
      ...txnFields,
      id,
      updated_at: new Date().toISOString(),
    };
    const withCategory = attachCategory(updated);
    transactions = transactions.map((t) => (t.id === id ? withCategory : t));
    notify();
    return withCategory;
  },

  deleteTransaction(id: string): void {
    transactions = transactions.filter((t) => t.id !== id);
    notify();
  },

  resetAll(
    seedCategories: Category[],
    seedTransactions: TransactionWithCategory[]
  ): void {
    categories = [...seedCategories];
    transactions = [...seedTransactions];
    notify();
  },

  getCategorySpending(categoryId: string): number {
    return transactions
      .filter((t) => t.category_id === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  },
};
