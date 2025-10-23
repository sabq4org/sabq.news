-- 🚨 إصلاح طارئ - استخدام الـ IDs مباشرة
-- Emergency Fix - Using Direct IDs
-- Date: 2025-10-23

-- ==================================================
-- الخطوة 1️⃣: احصل على IDs الأدوار
-- ==================================================

SELECT 
  '1️⃣ Role IDs' as step,
  id,
  name,
  name_ar
FROM roles
WHERE name IN ('system_admin', 'admin', 'editor')
ORDER BY name;

-- ==================================================
-- الخطوة 2️⃣: احصل على IDs الصلاحيات
-- ==================================================

SELECT 
  '2️⃣ Permission IDs' as step,
  id,
  code,
  label_ar
FROM permissions
WHERE code IN (
  'mirqab.view',
  'mirqab.create',
  'mirqab.edit',
  'mirqab.delete',
  'mirqab.publish',
  'mirqab.manage_settings'
)
ORDER BY code;

-- ==================================================
-- الخطوة 3️⃣: جرّب INSERT واحد فقط للاختبار
-- ==================================================

-- اختبار: system_admin + mirqab.view
DO $$
DECLARE
  v_role_id varchar;
  v_perm_id varchar;
BEGIN
  -- احصل على IDs
  SELECT id INTO v_role_id FROM roles WHERE name = 'system_admin';
  SELECT id INTO v_perm_id FROM permissions WHERE code = 'mirqab.view';
  
  -- اعرض القيم
  RAISE NOTICE 'Role ID: %, Permission ID: %', v_role_id, v_perm_id;
  
  -- جرّب الإضافة
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES (v_role_id, v_perm_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  RAISE NOTICE 'INSERT succeeded!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'INSERT failed: %', SQLERRM;
END $$;

-- تحقق من النتيجة
SELECT 
  '3️⃣ After Test Insert' as step,
  r.name,
  COUNT(p.id) as permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name = 'system_admin'
GROUP BY r.name;

-- ==================================================
-- الخطوة 4️⃣: فحص الـ constraints
-- ==================================================

SELECT 
  '4️⃣ Constraints' as step,
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'role_permissions'::regclass;

-- ==================================================
-- الخطوة 5️⃣: فحص نوع البيانات للأعمدة
-- ==================================================

SELECT 
  '5️⃣ Column Types' as step,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'role_permissions'
ORDER BY ordinal_position;
