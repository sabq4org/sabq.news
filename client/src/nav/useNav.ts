import { useMemo } from "react";
import { useLocation } from "wouter";
import type { NavItem, NavContext, NavState, UserRole } from "./types";
import { navConfig } from "./nav.config";

/**
 * فلترة عناصر القائمة بناءً على الدور والصلاحيات والمسار
 * Filter navigation items based on role, permissions, and path
 */
function filterNavTree(
  items: NavItem[],
  role: UserRole,
  flags: Record<string, boolean>
): NavItem[] {
  return items
    .filter((item) => {
      // Check role access
      if (!item.roles.includes(role)) {
        return false;
      }

      // Check feature flags
      if (item.featureFlags && item.featureFlags.length > 0) {
        const hasAllFlags = item.featureFlags.every((flag) => flags[flag] === true);
        if (!hasAllFlags) {
          return false;
        }
      }

      return true;
    })
    .map((item) => {
      // Recursively filter children
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterNavTree(item.children, role, flags);
        return {
          ...item,
          children: filteredChildren,
        };
      }
      return item;
    });
}

/**
 * تحويل الشجرة إلى قائمة مسطحة
 * Flatten tree to flat list
 */
function flattenNavTree(items: NavItem[]): NavItem[] {
  const flat: NavItem[] = [];

  function traverse(items: NavItem[]) {
    items.forEach((item) => {
      flat.push(item);
      if (item.children) {
        traverse(item.children);
      }
    });
  }

  traverse(items);
  return flat;
}

/**
 * إيجاد العنصر النشط بناءً على المسار
 * Find active item based on pathname
 */
function findActiveItem(items: NavItem[], pathname: string): NavItem | null {
  const flat = flattenNavTree(items);

  // First, try exact match
  const exactMatch = flat.find(
    (item) => item.path && item.meta?.exact && item.path === pathname
  );
  if (exactMatch) {
    return exactMatch;
  }

  // Then, try startsWith match (longest path first)
  const startsWithMatches = flat
    .filter((item) => item.path && pathname.startsWith(item.path))
    .sort((a, b) => (b.path?.length || 0) - (a.path?.length || 0));

  return startsWithMatches[0] || null;
}

/**
 * إيجاد الآباء للعنصر النشط
 * Find parents of active item
 */
function findParents(items: NavItem[], activeItem: NavItem | null): NavItem[] {
  if (!activeItem) return [];

  const parents: NavItem[] = [];

  function traverse(items: NavItem[], path: NavItem[]): boolean {
    for (const item of items) {
      const currentPath = [...path, item];

      if (activeItem && item.id === activeItem.id) {
        parents.push(...path);
        return true;
      }

      if (item.children) {
        if (traverse(item.children, currentPath)) {
          return true;
        }
      }
    }
    return false;
  }

  traverse(items, []);
  return parents;
}

/**
 * هوك للحصول على حالة التنقل المفلترة
 * Hook to get filtered navigation state
 */
export function useNav(context: NavContext): NavState {
  const navState = useMemo<NavState>(() => {
    // Use provided context
    const role = context.role;
    const flags = context.flags;
    const currentPath = context.pathname;

    // Filter tree
    const treeFiltered = filterNavTree(navConfig, role, flags);

    // Find active item
    const activeItem = findActiveItem(treeFiltered, currentPath);

    // Find parents
    const parents = findParents(treeFiltered, activeItem);

    // Flatten tree
    const flat = flattenNavTree(treeFiltered);

    return {
      treeFiltered,
      activeItem,
      parents,
      flat,
    };
  }, [context.role, context.flags, context.pathname]);

  return navState;
}

/**
 * تتبع حدث النقر على عنصر القائمة
 * Track navigation item click event
 */
export function trackNavClick(id: string, path?: string) {
  // Placeholder for analytics tracking
  if (typeof window !== "undefined") {
    console.log("[Nav] Item clicked:", { id, path, timestamp: new Date().toISOString() });
    
    // يمكن إضافة تكامل مع Google Analytics أو أي نظام تتبع آخر هنا
    // Example: window.gtag?.('event', 'nav_item_clicked', { id, path });
  }
}
