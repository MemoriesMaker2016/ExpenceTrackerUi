'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { BottomNav } from '@/components/layout/bottom-nav';
import { PayFlowProvider } from '@/components/pay-flow/pay-flow-provider';

const authRoutes = ['/login', '/register'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authRoutes.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <PayFlowProvider>
      <div className="min-h-screen pb-24 md:pb-0">{children}</div>
      <BottomNav />
    </PayFlowProvider>
  );
}
