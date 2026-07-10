import { supabase } from '@/lib/supabase';
import type { Category, Transaction } from '@/lib/types';

export async function createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>) {
  const { data: result, error } = await supabase
    .from('categories')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateCategory(id: string, data: Partial<Category>) {
  const { data: result, error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
  const { data: result, error } = await supabase
    .from('transactions')
    .insert(data)
    .select('*, category:categories(*)')
    .single();
  if (error) throw error;
  return result;
}

export async function updateTransaction(id: string, data: Partial<Transaction>) {
  const { data: result, error } = await supabase
    .from('transactions')
    .update(data)
    .eq('id', id)
    .select('*, category:categories(*)')
    .single();
  if (error) throw error;
  return result;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function getCategorySpending(categoryId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('category_id', categoryId)
    .eq('type', 'expense');
  if (error) throw error;
  return (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
}
