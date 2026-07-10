'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, X, Search, ImageIcon } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAllData } from '@/hooks/use-data';
import { useSettingsStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory } from '@/lib/types';

export default function ReceiptsPage() {
  const { transactions, loading } = useAllData();
  const { currency } = useSettingsStore();
  const [search, setSearch] = useState('');
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const receiptTransactions = useMemo(() => {
    const withReceipts = transactions.filter((t) => t.receipt_url);
    if (!search) return withReceipts;
    const q = search.toLowerCase();
    return withReceipts.filter(
      (t) =>
        t.item_name.toLowerCase().includes(q) ||
        t.category.name.toLowerCase().includes(q) ||
        formatDate(t.date).toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const previewTx = previewIndex !== null ? receiptTransactions[previewIndex] : null;

  const handlePrev = () => {
    setPreviewIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : receiptTransactions.length - 1));
  };

  const handleNext = () => {
    setPreviewIndex((prev) => (prev !== null && prev < receiptTransactions.length - 1 ? prev + 1 : 0));
  };

  if (loading) {
    return (
      <PageContainer title="Receipts" description="View all your uploaded bill receipts">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Receipts" description="View all your uploaded bill receipts">
      {receiptTransactions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-0 py-20 shadow-premium">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">No receipts uploaded yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a receipt image when adding a transaction to see it here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipts..."
              className="pl-9"
            />
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence>
              {receiptTransactions.map((t, i) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setPreviewIndex(i)}
                  className="group cursor-pointer"
                >
                  <Card className="overflow-hidden border-0 shadow-premium">
                    {/* Receipt image */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={t.receipt_url!}
                        alt={t.item_name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {/* Type badge */}
                      <div className="absolute right-2 top-2">
                        <Badge
                          variant={t.type === 'expense' ? 'destructive' : 'default'}
                          className="capitalize"
                        >
                          {t.type}
                        </Badge>
                      </div>
                      {/* Overlay info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="truncate text-sm font-semibold">{t.item_name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded"
                            style={{ backgroundColor: `${t.category.color}40` }}
                          >
                            <DynamicIcon name={t.category.icon} className="h-3 w-3" />
                          </div>
                          <span className="text-xs opacity-90">{t.category.name}</span>
                        </div>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="flex items-center justify-between p-3">
                      <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          t.type === 'expense' ? 'text-red-500' : 'text-green-500'
                        )}
                      >
                        {formatCurrency(Number(t.amount), currency)}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Lightbox preview */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogTitle className="sr-only">Receipt preview</DialogTitle>
          {previewTx && (
            <div>
              {/* Large image */}
              <div className="relative max-h-[70vh] overflow-hidden">
                <img
                  src={previewTx.receipt_url!}
                  alt={previewTx.item_name}
                  className="w-full object-contain"
                />
                {/* Close */}
                <button
                  onClick={() => setPreviewIndex(null)}
                  className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                >
                  <X className="h-5 w-5" />
                </button>
                {/* Nav arrows */}
                {receiptTransactions.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}
              </div>
              {/* Details */}
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${previewTx.category.color}20`, color: previewTx.category.color }}
                    >
                      <DynamicIcon name={previewTx.category.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{previewTx.item_name}</p>
                      <p className="text-xs text-muted-foreground">{previewTx.category.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-lg font-bold', previewTx.type === 'expense' ? 'text-red-500' : 'text-green-500')}>
                      {formatCurrency(Number(previewTx.amount), currency)}
                    </p>
                    <Badge variant="outline" className="mt-1 capitalize">{previewTx.type}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(previewTx.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{previewTx.status}</p>
                  </div>
                </div>
                {previewTx.notes && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="mt-0.5 text-sm">{previewTx.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
