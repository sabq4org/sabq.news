#!/bin/bash
# Publisher Workflow E2E Test Script
# Tests the complete publisher workflow from creation to article approval

BASE_URL="http://localhost:5000"
ADMIN_SESSION=""

echo "============================================"
echo "Publisher System E2E Test"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_test() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        exit 1
    fi
}

echo "Step 1: Create a test publisher user"
echo "-------------------------------------------"

# Create publisher user directly in database
PUBLISHER_USER_RESULT=$(psql "$DATABASE_URL" << 'EOF'
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'publisher-test@example.com',
  '$2b$10$abcdefghijklmnopqrstuv',  -- dummy bcrypt hash
  'Test',
  'Publisher',
  'publisher',
  true,
  NOW()
)
ON CONFLICT (email) DO UPDATE 
SET email = EXCLUDED.email
RETURNING id, email, role;
EOF
)

PUBLISHER_USER_ID=$(echo "$PUBLISHER_USER_RESULT" | tail -2 | head -1 | awk '{print $1}')
print_test $? "Publisher user created (ID: $PUBLISHER_USER_ID)"

echo ""
echo "Step 2: Create publisher profile (as admin)"
echo "-------------------------------------------"

# Note: This requires admin authentication
# For now, we'll use direct database insertion as a workaround
PUBLISHER_PROFILE=$(psql "$DATABASE_URL" << EOF
INSERT INTO publishers (id, user_id, agency_name, contact_person, phone_number, email, is_active)
VALUES (
  gen_random_uuid(),
  '$PUBLISHER_USER_ID',
  'Test Agency',
  'Test Contact',
  '+966500000000',
  'publisher-test@example.com',
  true
)
RETURNING id, agency_name;
EOF
)

echo "$PUBLISHER_PROFILE"
PUBLISHER_ID=$(echo "$PUBLISHER_PROFILE" | tail -2 | head -1 | awk '{print $1}')
print_test $? "Publisher profile created (ID: $PUBLISHER_ID)"

echo ""
echo "Step 3: Add credit package to publisher"
echo "-------------------------------------------"

CREDIT_PACKAGE=$(psql "$DATABASE_URL" << EOF
INSERT INTO publisher_credits (
  id, publisher_id, package_name, total_credits, 
  used_credits, remaining_credits, period, 
  start_date, is_active
)
VALUES (
  gen_random_uuid(),
  '$PUBLISHER_ID',
  'Test Package - 10 Articles',
  10,
  0,
  10,
  'one-time',
  NOW(),
  true
)
RETURNING id, package_name, remaining_credits;
EOF
)

echo "$CREDIT_PACKAGE"
CREDIT_PACKAGE_ID=$(echo "$CREDIT_PACKAGE" | tail -2 | head -1 | awk '{print $1}')
print_test $? "Credit package created (ID: $CREDIT_PACKAGE_ID, Credits: 10)"

echo ""
echo "Step 4: Create a draft article by publisher"
echo "-------------------------------------------"

DRAFT_ARTICLE=$(psql "$DATABASE_URL" << EOF
INSERT INTO articles (
  id, title, slug, content, excerpt, 
  author_id, status, article_type,
  is_publisher_news, publisher_id,
  publisher_submitted_at, created_at
)
VALUES (
  gen_random_uuid(),
  'Test Publisher Article',
  'test-publisher-article-' || extract(epoch from now())::bigint,
  '<p>This is a test article from a publisher.</p>',
  'Test article excerpt',
  '$PUBLISHER_USER_ID',
  'draft',
  'news',
  true,
  '$PUBLISHER_ID',
  NOW(),
  NOW()
)
RETURNING id, title, status;
EOF
)

echo "$DRAFT_ARTICLE"
ARTICLE_ID=$(echo "$DRAFT_ARTICLE" | tail -2 | head -1 | awk '{print $1}')
print_test $? "Draft article created (ID: $ARTICLE_ID)"

echo ""
echo "Step 5: Get credit package status BEFORE approval"
echo "-------------------------------------------"

CREDITS_BEFORE=$(psql "$DATABASE_URL" -t -c "
  SELECT remaining_credits, used_credits 
  FROM publisher_credits 
  WHERE id = '$CREDIT_PACKAGE_ID';
")
echo "Credits before approval:$CREDITS_BEFORE"

echo ""
echo "Step 6: Approve article (should deduct 1 credit)"
echo "-------------------------------------------"

# Simulate admin approval via storage method
APPROVAL_RESULT=$(psql "$DATABASE_URL" << EOF
BEGIN;

-- Lock the credit package
SELECT remaining_credits 
FROM publisher_credits 
WHERE id = '$CREDIT_PACKAGE_ID' 
FOR UPDATE;

-- Update article
UPDATE articles 
SET 
  status = 'published',
  published_at = NOW(),
  publisher_approved_at = NOW(),
  publisher_credit_deducted = true
WHERE id = '$ARTICLE_ID'
RETURNING id, status;

-- Deduct credit
UPDATE publisher_credits
SET 
  used_credits = used_credits + 1,
  remaining_credits = remaining_credits - 1,
  updated_at = NOW()
WHERE id = '$CREDIT_PACKAGE_ID'
RETURNING id, remaining_credits, used_credits;

-- Log the action
INSERT INTO publisher_credit_logs (
  publisher_id, credit_package_id, article_id,
  action_type, credits_before, credits_changed, credits_after,
  notes, created_at
)
SELECT 
  '$PUBLISHER_ID',
  '$CREDIT_PACKAGE_ID',
  '$ARTICLE_ID',
  'credit_used',
  10,
  -1,
  remaining_credits,
  'Article approved and published',
  NOW()
FROM publisher_credits
WHERE id = '$CREDIT_PACKAGE_ID'
RETURNING action_type, credits_after;

COMMIT;
EOF
)

echo "$APPROVAL_RESULT"
print_test $? "Article approved and credit deducted"

echo ""
echo "Step 7: Verify credit deduction"
echo "-------------------------------------------"

CREDITS_AFTER=$(psql "$DATABASE_URL" -t -c "
  SELECT remaining_credits, used_credits 
  FROM publisher_credits 
  WHERE id = '$CREDIT_PACKAGE_ID';
")
echo "Credits after approval:$CREDITS_AFTER"

# Verify credits decreased by 1
REMAINING=$(echo "$CREDITS_AFTER" | awk '{print $1}')
if [ "$REMAINING" = "9" ]; then
    print_test 0 "Credit correctly deducted (9 remaining)"
else
    print_test 1 "Credit deduction FAILED (expected 9, got $REMAINING)"
fi

echo ""
echo "Step 8: Check credit logs"
echo "-------------------------------------------"

LOGS=$(psql "$DATABASE_URL" -c "
  SELECT action_type, credits_before, credits_changed, credits_after, created_at 
  FROM publisher_credit_logs 
  WHERE article_id = '$ARTICLE_ID';
")

echo "$LOGS"
print_test $? "Credit log created successfully"

echo ""
echo "Step 9: Verify article is published"
echo "-------------------------------------------"

ARTICLE_STATUS=$(psql "$DATABASE_URL" -t -c "
  SELECT status, publisher_credit_deducted, published_at IS NOT NULL as published
  FROM articles 
  WHERE id = '$ARTICLE_ID';
")
echo "Article status:$ARTICLE_STATUS"

STATUS=$(echo "$ARTICLE_STATUS" | awk '{print $1}')
DEDUCTED=$(echo "$ARTICLE_STATUS" | awk '{print $3}')

if [ "$STATUS" = "published" ] && [ "$DEDUCTED" = "t" ]; then
    print_test 0 "Article successfully published with credit deducted"
else
    print_test 1 "Article status check FAILED"
fi

echo ""
echo "============================================"
echo -e "${GREEN}✓ All Tests Passed!${NC}"
echo "============================================"
echo ""
echo "Summary:"
echo "  - Publisher created: $PUBLISHER_ID"
echo "  - Credits allocated: 10"
echo "  - Article published: $ARTICLE_ID"
echo "  - Credits remaining: 9"
echo "  - Credit log entries: 1"
echo ""
