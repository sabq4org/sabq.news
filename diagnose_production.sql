-- 🔍 سكريبت تشخيصي لقاعدة الإنتاج
-- Production Database Diagnostic Script
-- Date: 2025-10-23

-- ==================================================
-- 1️⃣ فحص الأدوار الموجودة (Check Roles)
-- ==================================================

SELECT 
  '1️⃣ Existing Roles' as section,
  id,
  name,
  name_ar,
  description
FROM roles
WHERE name IN ('system_admin', 'admin', 'editor')
ORDER BY name;

-- ==================================================
-- 2️⃣ فحص صلاحيات المرقاب (Check Mirqab Permissions)
-- ==================================================

SELECT 
  '2️⃣ Mirqab Permissions' as section,
  id,
  code,
  label_ar,
  module
FROM permissions
WHERE code LIKE 'mirqab.%'
ORDER BY code;

-- ==================================================
-- 3️⃣ فحص ربط الصلاحيات بالأدوار (Check Role-Permission Mapping)
-- ==================================================

SELECT 
  '3️⃣ Current Mappings' as section,
  r.name as role_name,
  p.code as permission_code,
  p.label_ar,
  rp.role_id,
  rp.permission_id
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name IN ('system_admin', 'admin', 'editor')
ORDER BY r.name, p.code;

-- ==================================================
-- 4️⃣ عدد الصلاحيات لكل دور (Permissions Count)
-- ==================================================

SELECT 
  '4️⃣ Count Summary' as section,
  r.name as role_name,
  COUNT(p.id) as mirqab_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name IN ('system_admin', 'admin', 'editor')
GROUP BY r.name
ORDER BY mirqab_permissions DESC;

-- ==================================================
-- 5️⃣ اختبار الـ JOIN نفسه (Test the JOIN Query)
-- ==================================================

SELECT 
  '5️⃣ Test JOIN for system_admin' as section,
  r.id as role_id,
  r.name as role_name,
  p.id as permission_id,
  p.code as permission_code
FROM roles r
JOIN permissions p ON p.code IN (
  'mirqab.view',
  'mirqab.create',
  'mirqab.edit',
  'mirqab.delete',
  'mirqab.publish',
  'mirqab.manage_settings'
)
WHERE r.name = 'system_admin';

-- ==================================================
-- 6️⃣ فحص الـ constraints على جدول role_permissions
-- ==================================================

SELECT 
  '6️⃣ Table Constraints' as section,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'role_permissions'::regclass;

-- ✅ نهاية التشخيص
