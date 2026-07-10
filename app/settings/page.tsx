'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  User, DollarSign, Moon, Sun, Bell, Download, DatabaseBackup,
  RotateCcw, Info, Mail, Check, type LucideIcon,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettingsStore } from '@/lib/store';
import { CURRENCIES } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAllData } from '@/hooks/use-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const settings = useSettingsStore();
  const { transactions, categories, refetch } = useAllData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Item', 'Amount', 'Status', 'Notes'];
    const rows = transactions.map((t) => [
      t.date,
      t.type,
      t.category.name,
      t.item_name,
      String(t.amount),
      t.status,
      t.notes || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported to CSV');
  };

  const handleBackup = async () => {
    const backup = { categories, transactions, settings: { currency: settings.currency }, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded');
  };

  const handleReset = async () => {
    try {
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      settings.resetSettings();
      refetch();
      toast.success('Application reset');
    } catch (err) {
      toast.error('Failed to reset');
      console.error(err);
    }
  };

  return (
    <PageContainer title="Settings" description="Manage your preferences and data">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Profile */}
        <SettingsSection icon={User} title="Profile" delay={0}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={settings.profileName}
                onChange={(e) => settings.setProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={settings.profileEmail}
                  onChange={(e) => settings.setProfileEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Currency */}
        <SettingsSection icon={DollarSign} title="Currency" delay={0.05}>
          <div className="space-y-1.5">
            <Label>Select your preferred currency</Label>
            <Select value={settings.currency} onValueChange={settings.setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.label} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingsSection>

        {/* Theme */}
        <SettingsSection icon={theme === 'dark' ? Moon : Sun} title="Appearance" delay={0.1}>
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Check },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                    mounted && theme === opt.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-accent'
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection icon={Bell} title="Notifications" delay={0.15}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Budget alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when approaching budget limits</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={settings.setNotifications}
            />
          </div>
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection icon={DatabaseBackup} title="Data Management" delay={0.2}>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Data (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleBackup}>
              <DatabaseBackup className="mr-2 h-4 w-4" />
              Backup Database
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-500">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Application
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your categories and transactions. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-red-500 hover:bg-red-600">
                    Reset everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SettingsSection>

        {/* About */}
        <SettingsSection icon={Info} title="About" delay={0.25}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">App</span>
              <span className="font-medium">FinTrack</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Built with</span>
              <span className="font-medium">Next.js + Supabase</span>
            </div>
          </div>
        </SettingsSection>
      </div>
    </PageContainer>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  delay,
  children,
}: {
  icon: LucideIcon;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="border-0 p-5 shadow-premium">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}
