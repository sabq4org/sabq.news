-- ✅ تحقق بسيط ومباشر من صلاحيات المرقاب فقط
-- Simple verification of Mirqab permissions only
-- Date: 2025-10-23

-- ==================================================
-- 1️⃣ عرض صلاحيات المرقاب لـ system_admin فقط
-- ==================================================

SELECT 
  '1️⃣ system_admin mirqab permissions' as check,
  p.code as permission_code,
  p.label_ar
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'system_admin' 
  AND p.code LIKE 'mirqab.%'
ORDER BY p.code;

-- ==================================================
-- 2️⃣ عرض صلاحيات المرقاب لـ admin فقط
-- ==================================================

SELECT 
  '2️⃣ admin mirqab permissions' as check,
  p.code as permission_code,
  p.label_ar
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
  AND p.code LIKE 'mirqab.%'
ORDER BY p.code;

-- ==================================================
-- 3️⃣ عدد صلاحيات المرقاب لكل دور
-- ==================================================

SELECT 
  '3️⃣ Count of mirqab permissions' as check,
  r.name as role_name,
  COUNT(*) as mirqab_count
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.code LIKE 'mirqab.%'
  AND r.name IN ('system_admin', 'admin', 'editor')
GROUP BY r.name
ORDER BY mirqab_count DESC;
