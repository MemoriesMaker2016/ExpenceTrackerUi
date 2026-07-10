'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, ChevronDown, Receipt } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { SummaryCards } from '@/components/dashboard/summary-cards';
import { Charts } from '@/components/dashboard/charts';
import { CategoryProgress } from '@/components/dashboard/category-progress';
import { TransactionsTable } from '@/components/dashboard/transactions-table';
import { useAllData } from '@/hooks/use-data';
import { useSettingsStore } from '@/lib/store';
import { getStartOfMonth } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TransactionType } from '@/lib/types';

type TypeFilter = 'all' | TransactionType;

export default function DashboardPage() {
  const { categories, transactions, loading } = useAllData();
  const { currency } = useSettingsStore();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredTransactions = useMemo(() => {
    if (typeFilter === 'all') return transactions;
    return transactions.filter((t) => t.type === typeFilter);
  }, [transactions, typeFilter]);

  const stats = useMemo(() => {
    const totalExpense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalInvestment = filteredTransactions
      .filter((t) => t.type === 'investment')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthStart = getStartOfMonth();
    const thisMonthSpending = filteredTransactions
      .filter((t) => t.type === 'expense' && new Date(t.date) >= monthStart)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalBudget = categories
      .filter((c) => c.type === 'expense' && c.budget_limit)
      .reduce((sum, c) => sum + c.budget_limit!, 0);

    const remainingBudget = Math.max(0, totalBudget - totalExpense);

    return { totalExpense, totalInvestment, thisMonthSpending, remainingBudget };
  }, [filteredTransactions, categories]);

  if (loading) {
    return (
      <PageContainer
        title="Dashboard"
        description="Track your expenses and investments"
        action={<HeaderActions />}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Dashboard"
      description="Track your expenses and investments"
      action={<HeaderActions typeFilter={typeFilter} setTypeFilter={setTypeFilter} />}
    >
      <div className="space-y-6">
        <SummaryCards
          totalExpense={stats.totalExpense}
          totalInvestment={stats.totalInvestment}
          remainingBudget={stats.remainingBudget}
          thisMonthSpending={stats.thisMonthSpending}
        />

        <Charts transactions={filteredTransactions} />

        {typeFilter !== 'investment' && (
          <CategoryProgress categories={categories} transactions={filteredTransactions} />
        )}

        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent Transactions</h2>
          <TransactionsTable transactions={filteredTransactions} />
        </div>
      </div>
    </PageContainer>
  );
}

function HeaderActions({
  typeFilter,
  setTypeFilter,
}: {
  typeFilter?: TypeFilter;
  setTypeFilter?: (v: TypeFilter) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {typeFilter !== undefined && setTypeFilter && <TypeFilterDropdown value={typeFilter} onChange={setTypeFilter} />}
      <Link href="/settings">
        <Button variant="outline" size="icon" className="rounded-xl shadow-premium md:hidden">
          <Settings className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}

function TypeFilterDropdown({ value, onChange }: { value: TypeFilter; onChange: (v: TypeFilter) => void }) {
  const router = useRouter();
  const options: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'expense', label: 'Expense' },
    { value: 'investment', label: 'Investment' },
  ];
  const current = options.find((o) => o.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1.5 rounded-xl shadow-premium">
          <span className="text-sm font-medium">{current?.label}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center justify-between',
              value === opt.value && 'font-semibold text-primary'
            )}
          >
            {opt.label}
            {value === opt.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-primary"
              />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/receipts')}
          className="flex items-center gap-2"
        >
          <Receipt className="h-4 w-4" />
          Receipts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
