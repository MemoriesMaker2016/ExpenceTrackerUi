'use client';

import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Wallet, CalendarDays, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  delay?: number;
  subtitle?: string;
}

function SummaryCard({ title, amount, icon: Icon, gradient, iconBg, delay = 0, subtitle }: SummaryCardProps) {
  const { currency } = useSettingsStore();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-premium">
        <div className={cn('absolute inset-0 opacity-5', gradient)} />
        <div className="relative p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {formatCurrency(amount, currency)}
              </p>
              {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface SummaryCardsProps {
  totalExpense: number;
  totalInvestment: number;
  remainingBudget: number;
  thisMonthSpending: number;
}

export function SummaryCards({
  totalExpense,
  totalInvestment,
  remainingBudget,
  thisMonthSpending,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <SummaryCard
        title="Total Expense"
        amount={totalExpense}
        icon={TrendingDown}
        gradient="bg-red-500"
        iconBg="bg-red-500/10 text-red-500"
        delay={0}
      />
      <SummaryCard
        title="Total Investment"
        amount={totalInvestment}
        icon={TrendingUp}
        gradient="bg-green-500"
        iconBg="bg-green-500/10 text-green-500"
        delay={0.1}
      />
      <SummaryCard
        title="Remaining Budget"
        amount={remainingBudget}
        icon={Wallet}
        gradient="bg-blue-500"
        iconBg="bg-blue-500/10 text-blue-500"
        delay={0.2}
      />
      <SummaryCard
        title="This Month"
        amount={thisMonthSpending}
        icon={CalendarDays}
        gradient="bg-purple-500"
        iconBg="bg-purple-500/10 text-purple-500"
        delay={0.3}
      />
    </div>
  );
}
