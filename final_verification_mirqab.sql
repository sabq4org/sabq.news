-- ✅ التحقق النهائي من صلاحيات المرقاب
-- Final Verification of Mirqab Permissions
-- Date: 2025-10-23

-- ==================================================
-- 1️⃣ عدد صلاحيات المرقاب لكل دور
-- ==================================================

SELECT 
  '1️⃣ Mirqab Count' as check,
  r.name as role_name,
  COUNT(*) as mirqab_permissions
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.code LIKE 'mirqab.%'
  AND r.name IN ('system_admin', 'admin', 'editor')
GROUP BY r.name
ORDER BY mirqab_permissions DESC;

-- ==================================================
-- 2️⃣ تفاصيل صلاحيات system_admin
-- ==================================================

SELECT 
  '2️⃣ system_admin details' as check,
  p.code,
  p.label_ar
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'system_admin' 
  AND p.code LIKE 'mirqab.%'
ORDER BY p.code;

-- ==================================================
-- 3️⃣ تفاصيل صلاحيات admin
-- ==================================================

SELECT 
  '3️⃣ admin details' as check,
  p.code,
  p.label_ar
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin'
  AND p.code LIKE 'mirqab.%'
ORDER BY p.code;
