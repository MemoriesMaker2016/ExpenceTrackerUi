'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ImageIcon, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DynamicIcon } from '@/components/dynamic-icon';
import { formatCurrency, formatDate, getStartOfDay, getStartOfWeek, getStartOfMonth, getStartOfYear } from '@/lib/format';
import { useSettingsStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory, SortField, SortDirection, DateFilter } from '@/lib/types';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog';

interface TransactionsTableProps {
  transactions: TransactionWithCategory[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const { currency } = useSettingsStore();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'investment'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Map<string, string>();
    transactions.forEach((t) => set.set(t.category_id, t.category.name));
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  const filtered = useMemo(() => {
    let result = [...transactions];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.item_name.toLowerCase().includes(q) ||
        t.category.name.toLowerCase().includes(q) ||
        String(t.amount).includes(q) ||
        formatDate(t.date).toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category_id === categoryFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let start: Date;
      if (dateFilter === 'today') start = getStartOfDay(now);
      else if (dateFilter === 'week') start = getStartOfWeek(now);
      else if (dateFilter === 'month') start = getStartOfMonth(now);
      else if (dateFilter === 'year') start = getStartOfYear(now);
      else if (dateFilter === 'custom') {
        if (customRange.from && customRange.to) {
          result = result.filter((t) => {
            const d = new Date(t.date);
            return d >= customRange.from! && d <= customRange.to!;
          });
          return applySort(result, sortField, sortDir);
        }
        return applySort(result, sortField, sortDir);
      } else start = new Date(0);
      result = result.filter((t) => new Date(t.date) >= start);
    }

    return applySort(result, sortField, sortDir);
  }, [transactions, search, typeFilter, categoryFilter, dateFilter, customRange, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <>
      <Card className="border-0 shadow-premium">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className={cn(dateFilter !== 'all' && 'border-primary text-primary')}>
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Date Filter</p>
                    <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                    {dateFilter === 'custom' && (
                      <div className="pt-2">
                        <Calendar
                          mode="range"
                          selected={{ from: customRange.from, to: customRange.to }}
                          onSelect={(range) => setCustomRange({ from: range?.from, to: range?.to })}
                        />
                      </div>
                    )}
                    {(dateFilter !== 'all' || search || typeFilter !== 'all' || categoryFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDateFilter('all');
                          setSearch('');
                          setTypeFilter('all');
                          setCategoryFilter('all');
                          setCustomRange({});
                        }}
                      >
                        <X className="mr-1 h-3 w-3" /> Clear filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-foreground">
                    Date <SortIcon field="date" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button onClick={() => handleSort('item_name')} className="flex items-center gap-1 hover:text-foreground">
                    Item <SortIcon field="item_name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  <button onClick={() => handleSort('amount')} className="flex items-center gap-1 hover:text-foreground">
                    Amount <SortIcon field="amount" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Receipt</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.type === 'expense' ? 'destructive' : 'default'} className="capitalize">
                        {t.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${t.category.color}20`, color: t.category.color }}
                        >
                          <DynamicIcon name={t.category.icon} className="h-3.5 w-3.5" />
                        </div>
                        <span>{t.category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{t.item_name}</td>
                    <td className={cn('px-4 py-3 text-right font-semibold', t.type === 'expense' ? 'text-red-500' : 'text-green-500')}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(Number(t.amount), currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.receipt_url ? (
                        <button onClick={() => setPreviewImage(t.receipt_url)} className="inline-flex">
                          <img src={t.receipt_url} alt="Receipt" className="h-10 w-10 rounded-lg object-cover ring-1 ring-border" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        t.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                      )}>
                        {t.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No transactions found
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="space-y-2 p-3 md:hidden">
          <AnimatePresence>
            {filtered.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-border p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${t.category.color}20`, color: t.category.color }}
                    >
                      <DynamicIcon name={t.category.icon} className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.item_name}</p>
                      <p className="text-xs text-muted-foreground">{t.category.name} · {formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', t.type === 'expense' ? 'text-red-500' : 'text-green-500')}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(Number(t.amount), currency)}
                    </p>
                    {t.receipt_url && (
                      <button onClick={() => setPreviewImage(t.receipt_url)} className="mt-1 inline-flex">
                        <img src={t.receipt_url} alt="Receipt" className="h-8 w-8 rounded object-cover" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No transactions found
            </div>
          )}
        </div>
      </Card>

      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-md p-0">
          <DialogTitle className="sr-only">Receipt preview</DialogTitle>
          {previewImage && (
            <img src={previewImage} alt="Receipt" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function applySort(arr: TransactionWithCategory[], field: SortField, dir: SortDirection): TransactionWithCategory[] {
  return arr.sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    if (field === 'category') {
      aVal = a.category.name;
      bVal = b.category.name;
    } else if (field === 'amount') {
      aVal = Number(a.amount);
      bVal = Number(b.amount);
    } else if (field === 'date') {
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
    } else {
      aVal = a[field];
      bVal = b[field];
    }
    if (aVal < bVal) return dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}
