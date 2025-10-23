-- ✅ الحل النهائي باستخدام IDs المباشرة
-- FINAL Solution Using Direct IDs
-- Date: 2025-10-23

-- ==================================================
-- الخطوة 1️⃣: احصل على جميع الـ IDs المطلوبة
-- ==================================================

-- احصل على IDs الأدوار
WITH role_ids AS (
  SELECT id, name FROM roles WHERE name IN ('system_admin', 'admin')
),
-- احصل على IDs الصلاحيات
perm_ids AS (
  SELECT id, code FROM permissions WHERE code IN (
    'mirqab.view',
    'mirqab.create', 
    'mirqab.edit',
    'mirqab.delete',
    'mirqab.publish',
    'mirqab.manage_settings'
  )
)
-- اعرضها للتأكد
SELECT 
  '1️⃣ IDs to be used' as step,
  r.name as role_name,
  r.id as role_id,
  p.code as perm_code,
  p.id as perm_id
FROM role_ids r
CROSS JOIN perm_ids p
ORDER BY r.name, p.code;

-- ==================================================
-- الخطوة 2️⃣: الإضافة المباشرة باستخدام CTE
-- ==================================================

WITH role_ids AS (
  SELECT id, name FROM roles WHERE name IN ('system_admin', 'admin')
),
perm_ids AS (
  SELECT id, code FROM permissions WHERE code IN (
    'mirqab.view',
    'mirqab.create', 
    'mirqab.edit',
    'mirqab.delete',
    'mirqab.publish',
    'mirqab.manage_settings'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_ids r
CROSS JOIN perm_ids p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================================
-- الخطوة 3️⃣: التحقق من النتيجة
-- ==================================================

SELECT 
  '2️⃣ Final Result' as step,
  r.name as role_name,
  r.name_ar,
  COUNT(p.id) as mirqab_permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name IN ('system_admin', 'admin', 'editor')
GROUP BY r.id, r.name, r.name_ar
ORDER BY mirqab_permissions_count DESC;

-- ==================================================
-- الخطوة 4️⃣: عرض تفصيلي
-- ==================================================

SELECT 
  '3️⃣ Detailed View' as step,
  r.name as role_name,
  p.code as permission_code,
  p.label_ar
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name IN ('system_admin', 'admin', 'editor')
ORDER BY r.name, p.code;

-- ✅ انتهى!
-- Expected: system_admin=6, admin=6, editor=4
