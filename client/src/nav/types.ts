import { LucideIcon } from "lucide-react";

export type UserRole = "admin" | "editor" | "author" | "reviewer" | "analyst" | "guest";

export type BadgeIntent = "default" | "secondary" | "destructive" | "outline";

export interface NavBadge {
  key: string;
  intent?: BadgeIntent;
  count?: number;
}

export interface NavItemMeta {
  exact?: boolean;
  external?: boolean;
  newTab?: boolean;
}

export interface NavItem {
  id: string;
  labelKey: string;
  labelAr?: string; // Direct Arabic label
  path?: string;
  icon?: LucideIcon;
  roles: UserRole[];
  featureFlags?: string[];
  badge?: NavBadge;
  children?: NavItem[];
  meta?: NavItemMeta;
  divider?: boolean; // Show divider after this item
}

export interface NavContext {
  role: UserRole;
  flags: Record<string, boolean>;
  pathname: string;
}

export interface NavState {
  treeFiltered: NavItem[];
  activeItem: NavItem | null;
  parents: NavItem[];
  flat: NavItem[];
}
