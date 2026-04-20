import type { LucideIcon } from 'lucide-react';

export type TNavItem = {
  label: string;
  subtitle?: string;
  Icon: LucideIcon;
  href: string;
};

export type TFeatureNav = {
  label: string;
  items: Record<string, TNavItem>;
};
