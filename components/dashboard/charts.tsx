'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrencyShort, formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/lib/store';
import type { ChartFilter, TransactionWithCategory } from '@/lib/types';
import { format, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths, isWithinInterval } from 'date-fns';

interface ChartsProps {
  transactions: TransactionWithCategory[];
}

export function Charts({ transactions }: ChartsProps) {
  const [filter, setFilter] = useState<ChartFilter>('monthly');
  const { currency } = useSettingsStore();

  const { expenseByCategory, investmentByCategory, expenseTrend, investmentTrend } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (filter === 'weekly') {
      startDate = subDays(now, 7 * 4); // last 4 weeks
    } else if (filter === 'monthly') {
      startDate = subDays(now, 30 * 6); // last 6 months
    } else {
      startDate = startOfYear(now);
    }

    const filtered = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });

    // Expense by category
    const expenseMap = new Map<string, { name: string; value: number; color: string }>();
    filtered.filter((t) => t.type === 'expense').forEach((t) => {
      const key = t.category.name;
      const existing = expenseMap.get(key);
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        expenseMap.set(key, { name: key, value: Number(t.amount), color: t.category.color });
      }
    });

    // Investment by category
    const investmentMap = new Map<string, { name: string; value: number; color: string }>();
    filtered.filter((t) => t.type === 'investment').forEach((t) => {
      const key = t.category.name;
      const existing = investmentMap.get(key);
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        investmentMap.set(key, { name: key, value: Number(t.amount), color: t.category.color });
      }
    });

    // Trends
    let intervals: Date[];
    let formatStr: string;

    if (filter === 'weekly') {
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
      intervals = weeks;
      formatStr = 'MMM d';
    } else if (filter === 'monthly') {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      intervals = months;
      formatStr = 'MMM';
    } else {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      intervals = months;
      formatStr = 'MMM';
    }

    const expenseTrendData = intervals.map((intervalStart) => {
      const intervalEnd = filter === 'weekly'
        ? subDays(startOfWeek(intervalStart), -7)
        : filter === 'monthly'
        ? new Date(intervalStart.getFullYear(), intervalStart.getMonth() + 1, 0)
        : new Date(intervalStart.getFullYear(), intervalStart.getMonth() + 1, 0);

      const total = filtered
        .filter((t) => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: intervalStart, end: intervalEnd }))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return { name: format(intervalStart, formatStr), value: total };
    });

    const investmentTrendData = intervals.map((intervalStart) => {
      const intervalEnd = filter === 'weekly'
        ? subDays(startOfWeek(intervalStart), -7)
        : filter === 'monthly'
        ? new Date(intervalStart.getFullYear(), intervalStart.getMonth() + 1, 0)
        : new Date(intervalStart.getFullYear(), intervalStart.getMonth() + 1, 0);

      const total = filtered
        .filter((t) => t.type === 'investment' && isWithinInterval(new Date(t.date), { start: intervalStart, end: intervalEnd }))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return { name: format(intervalStart, formatStr), value: total };
    });

    return {
      expenseByCategory: Array.from(expenseMap.values()).sort((a, b) => b.value - a.value),
      investmentByCategory: Array.from(investmentMap.values()).sort((a, b) => b.value - a.value),
      expenseTrend: expenseTrendData,
      investmentTrend: investmentTrendData,
    };
  }, [transactions, filter]);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as ChartFilter)}
          variant="outline"
          className="gap-1"
        >
          <ToggleGroupItem value="weekly" className="text-xs">Weekly</ToggleGroupItem>
          <ToggleGroupItem value="monthly" className="text-xs">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="text-xs">Yearly</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Expense by Category - Pie */}
        <ChartCard title="Expense by Category" delay={0}>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Investment by Category - Pie */}
        <ChartCard title="Investment by Category" delay={0.1}>
          {investmentByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={investmentByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {investmentByCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Expense Trend - Line */}
        <ChartCard title="Expense Trend" delay={0.2}>
          {expenseTrend.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={expenseTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrencyShort(v, currency)}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        {/* Investment Trend - Bar */}
        <ChartCard title="Investment Trend" delay={0.3}>
          {investmentTrend.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={investmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrencyShort(v, currency)}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="border-0 p-5 shadow-premium">
        <h3 className="mb-4 text-sm font-semibold">{title}</h3>
        {children}
      </Card>
    </motion.div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[250px] items-center justify-center">
      <p className="text-sm text-muted-foreground">No data for this period</p>
    </div>
  );
}
