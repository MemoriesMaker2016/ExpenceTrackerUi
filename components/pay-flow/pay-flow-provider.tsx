'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { PayFlowModal } from './pay-flow-modal';

interface PayFlowContextValue {
  openPayFlow: () => void;
  closePayFlow: () => void;
  isOpen: boolean;
}

const PayFlowContext = createContext<PayFlowContextValue | null>(null);

export function PayFlowProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPayFlow = useCallback(() => setIsOpen(true), []);
  const closePayFlow = useCallback(() => setIsOpen(false), []);

  return (
    <PayFlowContext.Provider value={{ openPayFlow, closePayFlow, isOpen }}>
      {children}
      <PayFlowModal open={isOpen} onOpenChange={setIsOpen} />
    </PayFlowContext.Provider>
  );
}

export function usePayFlow() {
  const ctx = useContext(PayFlowContext);
  if (!ctx) throw new Error('usePayFlow must be used within PayFlowProvider');
  return ctx;
}
