export type TransactionType = 'expense' | 'investment';

export type TransactionStatus = 'completed' | 'pending';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  budget_limit: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  category_id: string;
  type: TransactionType;
  item_name: string;
  amount: number;
  date: string;
  receipt_url: string | null;
  notes: string | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export type DateFilter = 'today' | 'week' | 'month' | 'year' | 'custom' | 'all';
export type ChartFilter = 'weekly' | 'monthly' | 'yearly';
export type SortField = 'date' | 'amount' | 'item_name' | 'category';
export type SortDirection = 'asc' | 'desc';

export interface Settings {
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  profileName: string;
  profileEmail: string;
}

export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
];

export const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

export const CATEGORY_ICONS = [
  'Wallet', 'UtensilsCrossed', 'Plane', 'ShoppingBag', 'ReceiptText',
  'HeartPulse', 'TrendingUp', 'PieChart', 'Bitcoin', 'Coins',
  'Landmark', 'Car', 'Home', 'GraduationCap', 'Gift',
  'Dumbbell', 'Coffee', 'Smartphone', 'Book', 'Music',
  'Camera', 'Gamepad2', 'Briefcase', 'PiggyBank', 'CreditCard',
];
