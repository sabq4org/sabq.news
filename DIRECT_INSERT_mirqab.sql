-- ✅ إضافة مباشرة باستخدام IDs الفعلية
-- Direct INSERT using actual IDs from production database
-- Date: 2025-10-23

-- ==================================================
-- system_admin (6 صلاحيات)
-- ==================================================

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('c3bd3cae-5bf9-48ba-9657-0d41ff3c5dba', 'cd110fb8-f186-47fb-ae46-17d4ac372ac3');  -- mirqab.view

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('c3bd3cae-5bf9-48ba-9657-0d41ff3c5dba', 'a6dfc156-f7ca-402f-9b11-50aa68c0f7a8');  -- mirqab.create

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('c3bd3cae-5bf9-48ba-9657-0d41ff3c5dba', '6e4e7818-2673-4c27-8b78-21c27ccf9983');  -- mirqab.edit

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('c3bd3cae-5bf9-48ba-9657-0d41ff3c5dba', 'ef252558-52e6-403d-b055-10a58812d3ca');  -- mirqab.delete

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('c3bd3cae-5bf9-48ba-9657-0d41ff3c5dba', '11fb0835-b226-473c-b83a-b887735f7dcd');  -- mirqab.publish

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('c3bd3cae-5bf9-48ba-9657-0d41ff3c5dba', '882cec8d-db97-43dd-9bc4-0ee8585e8463');  -- mirqab.manage_settings

-- ==================================================
-- admin (6 صلاحيات)
-- ==================================================

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('48f06abf-dac4-4130-ae3c-0be37c8c2239', 'cd110fb8-f186-47fb-ae46-17d4ac372ac3');  -- mirqab.view

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('48f06abf-dac4-4130-ae3c-0be37c8c2239', 'a6dfc156-f7ca-402f-9b11-50aa68c0f7a8');  -- mirqab.create

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('48f06abf-dac4-4130-ae3c-0be37c8c2239', '6e4e7818-2673-4c27-8b78-21c27ccf9983');  -- mirqab.edit

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('48f06abf-dac4-4130-ae3c-0be37c8c2239', 'ef252558-52e6-403d-b055-10a58812d3ca');  -- mirqab.delete

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('48f06abf-dac4-4130-ae3c-0be37c8c2239', '11fb0835-b226-473c-b83a-b887735f7dcd');  -- mirqab.publish

INSERT INTO role_permissions (role_id, permission_id) VALUES 
('48f06abf-dac4-4130-ae3c-0be37c8c2239', '882cec8d-db97-43dd-9bc4-0ee8585e8463');  -- mirqab.manage_settings

-- ==================================================
-- التحقق من النتيجة
-- ==================================================

SELECT 
  r.name as role_name,
  COUNT(rp.permission_id) as mirqab_permissions_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'mirqab.%'
WHERE r.name IN ('system_admin', 'admin', 'editor')
GROUP BY r.name
ORDER BY mirqab_permissions_count DESC;

-- ✅ Expected: system_admin=6, admin=6, editor=4
