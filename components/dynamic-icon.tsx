'use client';

import {
  Wallet, UtensilsCrossed, Plane, ShoppingBag, ReceiptText,
  HeartPulse, TrendingUp, PieChart, Bitcoin, Coins,
  Landmark, Car, Home, GraduationCap, Gift,
  Dumbbell, Coffee, Smartphone, Book, Music,
  Camera, Gamepad2, Briefcase, PiggyBank, CreditCard,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Wallet, UtensilsCrossed, Plane, ShoppingBag, ReceiptText,
  HeartPulse, TrendingUp, PieChart, Bitcoin, Coins,
  Landmark, Car, Home, GraduationCap, Gift,
  Dumbbell, Coffee, Smartphone, Book, Music,
  Camera, Gamepad2, Briefcase, PiggyBank, CreditCard,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className, size }: DynamicIconProps) {
  const Icon = iconMap[name] || Wallet;
  return <Icon className={className} size={size} />;
}

export { iconMap };
