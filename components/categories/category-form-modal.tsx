'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DynamicIcon, iconMap } from '@/components/dynamic-icon';
import { createCategory, updateCategory, deleteCategory } from '@/lib/db';
import { CATEGORY_COLORS, CATEGORY_ICONS, type Category, type TransactionType } from '@/lib/types';
import { useSettingsStore } from '@/lib/store';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  type: TransactionType;
  existingNames: string[];
  onSaved: () => void;
}

export function CategoryFormModal({
  open,
  onOpenChange,
  category,
  type,
  existingNames,
  onSaved,
}: CategoryFormModalProps) {
  const { currency } = useSettingsStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0]);
  const [budgetLimit, setBudgetLimit] = useState('');
  const [unlimited, setUnlimited] = useState(type === 'investment');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setColor(category.color);
        setIcon(category.icon);
        setBudgetLimit(category.budget_limit ? String(category.budget_limit) : '');
        setUnlimited(category.budget_limit === null);
        setDescription(category.description || '');
      } else {
        setName('');
        setColor(CATEGORY_COLORS[0]);
        setIcon(CATEGORY_ICONS[0]);
        setBudgetLimit('');
        setUnlimited(type === 'investment');
        setDescription('');
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [open, category, type]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Category name is required';
    } else {
      const lowerName = name.trim().toLowerCase();
      const existing = existingNames.filter((n) => n.toLowerCase() === lowerName);
      if (existing.length > 0 && (!category || category.name.toLowerCase() !== lowerName)) {
        errs.name = 'A category with this name already exists';
      }
    }
    if (!unlimited) {
      const limit = parseFloat(budgetLimit);
      if (!budgetLimit || isNaN(limit) || limit <= 0) {
        errs.budgetLimit = 'Budget limit must be greater than 0';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        type,
        color,
        icon,
        budget_limit: unlimited ? null : parseFloat(budgetLimit),
        description: description.trim() || null,
      };
      if (category) {
        await updateCategory(category.id, data);
        toast.success('Category updated');
      } else {
        await createCategory(data);
        toast.success('Category created');
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to save category');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    setSubmitting(true);
    try {
      await deleteCategory(category.id);
      toast.success('Category deleted');
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to delete category');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <DynamicIcon name={icon} className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">{name || 'Category name'}</p>
              <p className="text-xs text-muted-foreground capitalize">{type}</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Food"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-lg transition-transform hover:scale-110',
                    color === c && 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2">
              {CATEGORY_ICONS.map((ic) => {
                const IconComp = iconMap[ic];
                return (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
                      icon === ic ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    )}
                  >
                    <IconComp className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget limit */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="budget">Budget Limit</Label>
              {type === 'investment' && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="unlimited" className="text-xs text-muted-foreground">Unlimited</Label>
                  <Switch id="unlimited" checked={unlimited} onCheckedChange={setUnlimited} />
                </div>
              )}
            </div>
            {!unlimited && (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥'}
                  </span>
                  <Input
                    id="budget"
                    type="number"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    placeholder="5000"
                    className={`pl-8 ${errors.budgetLimit ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.budgetLimit && <p className="text-xs text-red-500">{errors.budgetLimit}</p>}
              </>
            )}
            {unlimited && (
              <p className="text-xs text-muted-foreground">No spending limit for this category</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {category && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="mr-auto"
              size="icon"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary text-white">
            {submitting ? 'Saving...' : category ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/95 backdrop-blur-sm"
          >
            <div className="max-w-xs p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <p className="font-medium">Delete this category?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                All transactions in this category will also be deleted. This cannot be undone.
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={submitting}>Delete</Button>
              </div>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
