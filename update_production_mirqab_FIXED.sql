-- ✅ سكريبت محسّن لتحديث صلاحيات المرقاب في قاعدة الإنتاج
-- Fixed Production Database Update Script for Mirqab Permissions
-- Date: 2025-10-23 (FIXED VERSION)

-- ==================================================
-- Step 1: إضافة/تحديث صلاحيات المرقاب (UPSERT)
-- ==================================================

INSERT INTO permissions (code, label, label_ar, module) VALUES
  ('mirqab.view', 'View Mirqab', 'عرض المرقاب', 'mirqab'),
  ('mirqab.create', 'Create Mirqab Content', 'إنشاء محتوى المرقاب', 'mirqab'),
  ('mirqab.edit', 'Edit Mirqab Content', 'تعديل محتوى المرقاب', 'mirqab'),
  ('mirqab.delete', 'Delete Mirqab Content', 'حذف محتوى المرقاب', 'mirqab'),
  ('mirqab.publish', 'Publish Mirqab Content', 'نشر محتوى المرقاب', 'mirqab'),
  ('mirqab.manage_settings', 'Manage Mirqab Settings', 'إدارة إعدادات المرقاب', 'mirqab')
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  label_ar = EXCLUDED.label_ar,
  module = EXCLUDED.module;

-- ==================================================
-- Step 2: ربط جميع الصلاحيات بـ system_admin
-- ==================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
JOIN permissions p ON p.code IN (
  'mirqab.view',
  'mirqab.create',
  'mirqab.edit',
  'mirqab.delete',
  'mirqab.publish',
  'mirqab.manage_settings'
)
WHERE r.name = 'system_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================================
-- Step 3: ربط جميع الصلاحيات بـ admin
-- ==================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
JOIN permissions p ON p.code IN (
  'mirqab.view',
  'mirqab.create',
  'mirqab.edit',
  'mirqab.delete',
  'mirqab.publish',
  'mirqab.manage_settings'
)
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================================
-- Step 4: ربط صلاحيات محددة بـ editor
-- (view, create, edit, publish فقط)
-- ==================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
JOIN permissions p ON p.code IN (
  'mirqab.view',
  'mirqab.create',
  'mirqab.edit',
  'mirqab.publish'
)
WHERE r.name = 'editor'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================================
-- التحقق من النتائج (Verification)
-- ==================================================

-- 1️⃣ عرض جميع صلاحيات المرقاب
SELECT 
  '1️⃣ Mirqab Permissions' as section,
  code, 
  label_ar,
  module
FROM permissions 
WHERE code LIKE 'mirqab.%'
ORDER BY code;

-- 2️⃣ عرض عدد الصلاحيات لكل دور
SELECT 
  '2️⃣ Permissions Count' as section,
  r.name as role_name,
  r.name_ar,
  COUNT(p.id) as mirqab_permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name IN ('system_admin', 'admin', 'editor')
GROUP BY r.id, r.name, r.name_ar
ORDER BY mirqab_permissions_count DESC;

-- 3️⃣ عرض تفصيلي لصلاحيات كل دور
SELECT 
  '3️⃣ Detailed Permissions' as section,
  r.name as role_name,
  p.code as permission_code,
  p.label_ar
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name IN ('system_admin', 'admin', 'editor')
  AND p.code LIKE 'mirqab.%'
ORDER BY r.name, p.code;

-- ✅ تم التحديث بنجاح!
-- Expected results:
-- system_admin: 6 permissions
-- admin: 6 permissions
-- editor: 4 permissions
