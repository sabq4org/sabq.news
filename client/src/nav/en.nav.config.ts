import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  PlusCircle,
  MessageSquare,
  Newspaper,
  UserCircle,
  Blocks,
  LayoutGrid,
} from "lucide-react";
import type { NavItem } from "./types";

/**
 * English Navigation Configuration
 * Simplified to show only implemented pages
 */
export const englishNavConfig: NavItem[] = [
  {
    id: "dashboard",
    labelKey: "nav.dashboard",
    labelAr: "نظرة عامة",
    labelEn: "Overview",
    path: "/en/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "editor", "author", "reviewer", "analyst", "reporter"],
    meta: { exact: true },
  },

  // ===== المحتوى / Content =====
  {
    id: "content",
    labelKey: "nav.content",
    labelAr: "المحتوى",
    labelEn: "Content",
    icon: Newspaper,
    roles: ["admin", "editor", "author", "reviewer"],
    children: [
      {
        id: "articles",
        labelKey: "nav.articles",
        labelAr: "الأخبار والمقالات",
        labelEn: "News & Articles",
        path: "/en/dashboard/articles",
        icon: FileText,
        roles: ["admin", "editor", "author", "reviewer"],
      },
      {
        id: "new_article",
        labelKey: "nav.new_article",
        labelAr: "مقال جديد",
        labelEn: "New Article",
        path: "/en/dashboard/articles/new",
        icon: PlusCircle,
        roles: ["admin", "editor", "author"],
      },
      {
        id: "categories",
        labelKey: "nav.categories",
        labelAr: "التصنيفات",
        labelEn: "Categories",
        path: "/en/dashboard/categories",
        icon: FolderOpen,
        roles: ["admin", "editor"],
      },
      {
        id: "comments",
        labelKey: "nav.comments",
        labelAr: "التعليقات",
        labelEn: "Comments",
        path: "/en/dashboard/comments",
        icon: MessageSquare,
        roles: ["admin", "editor", "reviewer"],
      },
    ],
  },

  // ===== Smart Content / المحتوى الذكي =====
  {
    id: "smart_content",
    labelKey: "nav.smart_content",
    labelAr: "المحتوى الذكي",
    labelEn: "Smart Content",
    icon: Blocks,
    roles: ["admin", "editor"],
    children: [
      {
        id: "smart_blocks",
        labelKey: "nav.smart_blocks",
        labelAr: "البلوكات الذكية",
        labelEn: "Smart Blocks",
        path: "/en/dashboard/smart-blocks",
        icon: Blocks,
        roles: ["admin", "editor"],
      },
      {
        id: "quad_categories",
        labelKey: "nav.quad_categories",
        labelAr: "التصنيفات الرباعية",
        labelEn: "Quad Categories",
        path: "/en/dashboard/quad-categories",
        icon: LayoutGrid,
        roles: ["admin", "editor"],
      },
    ],
  },

  // ===== المستخدمون / Users =====
  {
    id: "users",
    labelKey: "nav.users_and_roles",
    labelAr: "المستخدمون والأدوار",
    labelEn: "Users",
    icon: Users,
    roles: ["admin"],
    children: [
      {
        id: "users_mgmt",
        labelKey: "nav.users",
        labelAr: "المستخدمون",
        labelEn: "Users",
        path: "/en/dashboard/users",
        icon: UserCircle,
        roles: ["admin"],
      },
    ],
  },
];
