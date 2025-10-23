-- ✅ سكريبت مباشر لإصلاح صلاحيات المرقاب
-- SIMPLE & DIRECT Fix for Mirqab Permissions
-- Date: 2025-10-23

-- ==================================================
-- الخطوة 1️⃣: حذف الربط القديم (إن وجد) لتجنب التعارضات
-- ==================================================

DELETE FROM role_permissions
WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('system_admin', 'admin')
)
AND permission_id IN (
  SELECT id FROM permissions WHERE code LIKE 'mirqab.%'
);

-- ==================================================
-- الخطوة 2️⃣: إضافة صلاحيات system_admin (6 صلاحيات)
-- ==================================================

-- mirqab.view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'system_admin' AND p.code = 'mirqab.view';

-- mirqab.create
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'system_admin' AND p.code = 'mirqab.create';

-- mirqab.edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'system_admin' AND p.code = 'mirqab.edit';

-- mirqab.delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'system_admin' AND p.code = 'mirqab.delete';

-- mirqab.publish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'system_admin' AND p.code = 'mirqab.publish';

-- mirqab.manage_settings
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'system_admin' AND p.code = 'mirqab.manage_settings';

-- ==================================================
-- الخطوة 3️⃣: إضافة صلاحيات admin (6 صلاحيات)
-- ==================================================

-- mirqab.view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.code = 'mirqab.view';

-- mirqab.create
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.code = 'mirqab.create';

-- mirqab.edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.code = 'mirqab.edit';

-- mirqab.delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.code = 'mirqab.delete';

-- mirqab.publish
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.code = 'mirqab.publish';

-- mirqab.manage_settings
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.code = 'mirqab.manage_settings';

-- ==================================================
-- الخطوة 4️⃣: التحقق من النتيجة النهائية
-- ==================================================

SELECT 
  'النتيجة النهائية' as status,
  r.name as role_name,
  r.name_ar,
  COUNT(p.id) as mirqab_permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name IN ('system_admin', 'admin', 'editor')
GROUP BY r.id, r.name, r.name_ar
ORDER BY mirqab_permissions_count DESC;

-- عرض تفصيلي
SELECT 
  'التفاصيل' as details,
  r.name as role_name,
  p.code as permission_code,
  p.label_ar
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name IN ('system_admin', 'admin', 'editor')
ORDER BY r.name, p.code;

-- ✅ تم بنجاح!
-- Expected: system_admin = 6, admin = 6, editor = 4
