'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Settings, FolderOpen, Plus, Wallet, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePayFlow } from '@/components/pay-flow/pay-flow-provider';

const desktopNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/categories', label: 'Categories', icon: FolderOpen },
  { href: '/receipts', label: 'Receipts', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { openPayFlow } = usePayFlow();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">FinTrack</p>
            <p className="text-xs text-muted-foreground">Finance Tracker</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 px-3">
          {desktopNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {active && (
                  <motion.div
                    layoutId="desktop-active"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto p-4">
          <button
            onClick={openPayFlow}
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-pay py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav — floating pill card with center Pay button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4 md:hidden">
        <div className="relative flex w-full max-w-sm items-center justify-between rounded-[28px] border border-border bg-card/90 px-4 pb-2 pt-2 shadow-2xl backdrop-blur-xl">
          {/* Home — left */}
          <Link
            href="/"
            className={cn(
              'flex w-16 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors',
              pathname === '/' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Home className="h-5 w-5" />
            Home
          </Link>

          {/* Pay — center floating circle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={openPayFlow}
            className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full gradient-pay shadow-glow ring-4 ring-background"
            aria-label="Add transaction"
          >
            <Plus className="h-6 w-6 text-white" />
          </motion.button>

          {/* Categories — right */}
          <Link
            href="/categories"
            className={cn(
              'flex w-16 flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors',
              pathname === '/categories' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <FolderOpen className="h-5 w-5" />
            Categories
          </Link>
        </div>
      </div>
    </>
  );
}
