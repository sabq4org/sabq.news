-- تحديث قاعدة الإنتاج بصلاحيات المرقاب
-- Production Database Update Script for Mirqab Permissions
-- Date: 2025-10-23

-- ==================================================
-- Step 1: إضافة صلاحيات المرقاب (Mirqab Permissions)
-- ==================================================

INSERT INTO permissions (code, label, label_ar, module) VALUES
  ('mirqab.view', 'View Mirqab', 'عرض المرقاب', 'mirqab'),
  ('mirqab.create', 'Create Mirqab Content', 'إنشاء محتوى المرقاب', 'mirqab'),
  ('mirqab.edit', 'Edit Mirqab Content', 'تعديل محتوى المرقاب', 'mirqab'),
  ('mirqab.delete', 'Delete Mirqab Content', 'حذف محتوى المرقاب', 'mirqab'),
  ('mirqab.publish', 'Publish Mirqab Content', 'نشر محتوى المرقاب', 'mirqab'),
  ('mirqab.manage_settings', 'Manage Mirqab Settings', 'إدارة إعدادات المرقاب', 'mirqab')
ON CONFLICT (code) DO NOTHING;

-- ==================================================
-- Step 2: ربط الصلاحيات بدور system_admin
-- ==================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'system_admin'
  AND p.module = 'mirqab'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================================
-- Step 3: ربط الصلاحيات بدور admin
-- ==================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.module = 'mirqab'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================================
-- Step 4: ربط صلاحيات محددة بدور editor
-- (view, create, edit, publish فقط - بدون delete و manage_settings)
-- ==================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'editor'
  AND p.code IN ('mirqab.view', 'mirqab.create', 'mirqab.edit', 'mirqab.publish')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================================
-- التحقق من النتائج
-- ==================================================

-- عرض الصلاحيات الجديدة
SELECT 
  'Mirqab Permissions' as section,
  code, 
  label_ar,
  module
FROM permissions 
WHERE module = 'mirqab'
ORDER BY code;

-- عرض عدد الصلاحيات لكل دور
SELECT 
  r.name as role_name,
  r.name_ar,
  COUNT(p.id) as mirqab_permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.module = 'mirqab'
GROUP BY r.id, r.name, r.name_ar
ORDER BY mirqab_permissions_count DESC;

-- ✅ تم التحديث بنجاح!
