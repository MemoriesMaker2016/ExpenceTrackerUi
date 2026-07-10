'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, TrendingDown, TrendingUp } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/dynamic-icon';
import { CategoryFormModal } from '@/components/categories/category-form-modal';
import { useAllData } from '@/hooks/use-data';
import { useSettingsStore } from '@/lib/store';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Category, TransactionType } from '@/lib/types';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const { categories, transactions, loading, refetch } = useAllData();
  const { currency } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const getSpent = (categoryId: string): number => {
    return transactions
      .filter((t) => t.category_id === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  return (
    <PageContainer title="Categories" description="Manage your expense and investment categories">
      <div className="space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransactionType)}>
          <TabsList className="w-full max-w-xs">
            <TabsTrigger value="expense" className="flex-1 gap-1.5">
              <TrendingDown className="h-4 w-4" /> Expense
            </TabsTrigger>
            <TabsTrigger value="investment" className="flex-1 gap-1.5">
              <TrendingUp className="h-4 w-4" /> Investment
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Category grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((cat, i) => {
              const spent = getSpent(cat.id);
              const limit = cat.budget_limit;
              const pct = limit ? Math.min((spent / limit) * 100, 100) : 0;
              return (
                <motion.div
                  key={cat.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="group relative overflow-hidden border-0 p-4 shadow-premium">
                    <div
                      className="absolute right-0 top-0 h-24 w-24 rounded-full opacity-10 blur-2xl"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="relative">
                      <div className="flex items-start justify-between">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <DynamicIcon name={cat.icon} className="h-6 w-6" />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => handleEdit(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="mt-3 font-semibold">{cat.name}</h3>
                      {cat.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                      )}
                      {activeTab === 'expense' && limit ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {formatCurrency(spent, currency)} / {formatCurrency(limit, currency)}
                            </span>
                            <span className={cn(
                              'font-medium',
                              pct >= 100 ? 'text-red-500' : pct >= 80 ? 'text-yellow-500' : 'text-green-500'
                            )}>
                              {Math.round(pct)}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                              className={cn(
                                'h-full rounded-full',
                                pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                              )}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {activeTab === 'investment' && !limit ? 'Unlimited' : formatCurrency(spent, currency)}
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredCategories.length === 0 && !loading && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No {activeTab} categories yet</p>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={handleAdd}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full gradient-pay shadow-glow ring-4 ring-background md:bottom-8 md:right-8"
        aria-label="Add category"
      >
        <Plus className="h-6 w-6 text-white" />
      </motion.button>

      <CategoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={editingCategory}
        type={activeTab}
        existingNames={categories.map((c) => c.name)}
        onSaved={refetch}
      />
    </PageContainer>
  );
}
