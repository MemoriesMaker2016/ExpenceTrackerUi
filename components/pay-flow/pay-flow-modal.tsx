'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, AlertTriangle, Upload, X, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DynamicIcon } from '@/components/dynamic-icon';
import { useAllData } from '@/hooks/use-data';
import { createTransaction } from '@/lib/db';
import { useSettingsStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TransactionType, Category } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PayFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'type' | 'category' | 'form';

export function PayFlowModal({ open, onOpenChange }: PayFlowModalProps) {
  const [step, setStep] = useState<Step>('type');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { categories, transactions, refetch } = useAllData();
  const { currency } = useSettingsStore();

  // Form state
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [receipt, setReceipt] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setStep('type');
      setType('expense');
      setSelectedCategory(null);
      setItemName('');
      setAmount('');
      setDate(new Date());
      setReceipt(null);
      setNotes('');
      setErrors({});
    }
  }, [open]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const getCategorySpent = (categoryId: string): number => {
    return transactions
      .filter((t) => t.category_id === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const isCategoryDisabled = (cat: Category): boolean => {
    if (type !== 'expense' || !cat.budget_limit) return false;
    return getCategorySpent(cat.id) >= cat.budget_limit;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceipt(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!itemName.trim()) errs.itemName = 'Item name is required';
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Amount must be greater than 0';
    if (type === 'expense' && selectedCategory?.budget_limit) {
      const spent = getCategorySpent(selectedCategory.id);
      if (spent + amt > selectedCategory.budget_limit) {
        errs.amount = `This category budget has been exceeded. Available: ${formatCurrency(selectedCategory.budget_limit - spent, currency)}`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!selectedCategory) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createTransaction({
        category_id: selectedCategory.id,
        type,
        item_name: itemName.trim(),
        amount: parseFloat(amount),
        date: format(date, 'yyyy-MM-dd'),
        receipt_url: receipt,
        notes: notes.trim() || null,
        status: 'completed',
      });
      toast.success(`${type === 'expense' ? 'Expense' : 'Investment'} added successfully`);
      refetch();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to save transaction');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0 gap-0">
        <DialogTitle className="sr-only">Add Transaction</DialogTitle>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          {step !== 'type' && (
            <button
              onClick={() => setStep(step === 'form' ? 'category' : 'type')}
              className="rounded-lg p-1.5 hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {step === 'type' && 'New Transaction'}
              {step === 'category' && `Select ${type} category`}
              {step === 'form' && 'Transaction details'}
            </p>
            <p className="text-xs text-muted-foreground">Step {step === 'type' ? 1 : step === 'category' ? 2 : 3} of 3</p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {['type', 'category', 'form'].map((s, i) => {
              const stepIndex = ['type', 'category', 'form'].indexOf(step);
              return (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i <= stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                  )}
                />
              );
            })}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Type selection */}
            {step === 'type' && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5"
              >
                <p className="mb-4 text-center text-sm text-muted-foreground">Choose transaction type</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setType('expense'); setStep('category'); }}
                    className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 transition-transform group-hover:scale-110">
                      <ArrowLeft className="h-6 w-6 rotate-45" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Expense</p>
                      <p className="text-xs text-muted-foreground">Track spending</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setType('investment'); setStep('category'); }}
                    className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 transition-transform group-hover:scale-110">
                      <Check className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Investment</p>
                      <p className="text-xs text-muted-foreground">Grow wealth</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Category selection */}
            {step === 'category' && (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-5"
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {filteredCategories.map((cat) => {
                    const disabled = isCategoryDisabled(cat);
                    const spent = getCategorySpent(cat.id);
                    const limit = cat.budget_limit;
                    return (
                      <button
                        key={cat.id}
                        disabled={disabled}
                        onClick={() => { setSelectedCategory(cat); setStep('form'); }}
                        className={cn(
                          'group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                          disabled
                            ? 'cursor-not-allowed border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20'
                            : 'border-border hover:border-primary hover:bg-primary/5'
                        )}
                      >
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <DynamicIcon name={cat.icon} className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">{cat.name}</p>
                        {type === 'expense' && limit && (
                          <p className={cn('text-xs', disabled ? 'text-red-500' : 'text-muted-foreground')}>
                            {disabled ? 'Limit reached' : `${formatCurrency(spent, currency)} / ${formatCurrency(limit, currency)}`}
                          </p>
                        )}
                        {disabled && (
                          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                            <AlertTriangle className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {filteredCategories.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No {type} categories yet. Add some in the Categories page.
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 3: Transaction form */}
            {step === 'form' && selectedCategory && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 p-5"
              >
                {/* Selected category badge */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
                  >
                    <DynamicIcon name={selectedCategory.icon} className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedCategory.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{type}</p>
                  </div>
                  {type === 'expense' && selectedCategory.budget_limit && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="text-sm font-semibold text-green-500">
                        {formatCurrency(Math.max(0, selectedCategory.budget_limit - getCategorySpent(selectedCategory.id)), currency)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Item name */}
                <div className="space-y-1.5">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Grocery shopping"
                    className={errors.itemName ? 'border-red-500' : ''}
                  />
                  {errors.itemName && <p className="text-xs text-red-500">{errors.itemName}</p>}
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥'}
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDate(date)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Receipt upload */}
                <div className="space-y-1.5">
                  <Label>Receipt (optional)</Label>
                  {receipt ? (
                    <div className="relative">
                      <img src={receipt} alt="Receipt" className="h-32 w-full rounded-lg object-cover" />
                      <button
                        onClick={() => setReceipt(null)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-primary/5">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Upload receipt</p>
                        <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP (max 2MB)</p>
                      </div>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes..."
                    className="resize-none"
                    rows={2}
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full gradient-pay text-white shadow-glow"
                >
                  {submitting ? 'Saving...' : `Add ${type === 'expense' ? 'Expense' : 'Investment'}`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
