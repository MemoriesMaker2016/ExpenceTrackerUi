'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category, Transaction, TransactionWithCategory } from '@/lib/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories, setCategories };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .order('date', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setTransactions((data || []) as TransactionWithCategory[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions, setTransactions };
}

export function useAllData() {
  const { categories, loading: catLoading, error: catError, refetch: refetchCats } = useCategories();
  const { transactions, loading: txnLoading, error: txnError, refetch: refetchTxns } = useTransactions();

  const refetch = useCallback(() => {
    refetchCats();
    refetchTxns();
  }, [refetchCats, refetchTxns]);

  return {
    categories,
    transactions,
    loading: catLoading || txnLoading,
    error: catError || txnError,
    refetch,
  };
}
