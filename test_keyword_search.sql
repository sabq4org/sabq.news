-- Test keyword search logic
SELECT 
  id, 
  title,
  substring(content, 1, 100) as content_preview,
  CASE 
    WHEN title ILIKE '%اقتصاد%' THEN 'Found in title'
    WHEN content ILIKE '%اقتصاد%' THEN 'Found in content'
    ELSE 'Not found'
  END as match_type
FROM articles 
WHERE status = 'published'
LIMIT 5;
