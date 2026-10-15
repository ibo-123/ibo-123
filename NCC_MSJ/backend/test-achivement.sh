#!/bin/bash

echo "🚀 NCC MANAGEMENT SYSTEM - API TEST SUITE"
echo "=========================================="

BASE_URL="http://localhost:5000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for tests
PASSED=0
FAILED=0
TOTAL=0

# Function to print test result
print_result() {
    TOTAL=$((TOTAL+1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $2"
        PASSED=$((PASSED+1))
    else
        echo -e "${RED}❌ FAIL${NC} - $2"
        FAILED=$((FAILED+1))
    fi
}

echo -e "\n${YELLOW}1. HEALTH CHECK${NC}"
echo "------------------------"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"success"'; then
    print_result 0 "Health check passed"
else
    print_result 1 "Health check failed"
fi

echo -e "\n${YELLOW}2. REGISTER NEW USER${NC}"
echo "------------------------"
TIMESTAMP=$(date +%s)
REGISTER_DATA="{
    \"name\": \"Test User $TIMESTAMP\",
    \"email\": \"test$TIMESTAMP@example.com\",
    \"password\": \"Test@123456\",
    \"studentId\": \"NCC$TIMESTAMP\",
    \"department\": \"Computer Science\",
    \"year\": \"First\"
}"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA")

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "User registered successfully"
else
    print_result 1 "User registration failed"
fi

echo -e "\n${YELLOW}3. LOGIN USER${NC}"
echo "------------------------"
LOGIN_DATA="{
    \"email\": \"test$TIMESTAMP@example.com\",
    \"password\": \"Test@123456\"
}"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    print_result 0 "Login successful - Token obtained"
    echo "   Token: ${TOKEN:0:20}..."
else
    print_result 1 "Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "\n${YELLOW}4. GET CURRENT USER PROFILE${NC}"
echo "------------------------"
PROFILE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/auth/me")

if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "User profile retrieved"
else
    print_result 1 "Failed to get user profile"
fi

echo -e "\n${YELLOW}5. GET PUBLIC ACHIEVEMENTS${NC}"
echo "------------------------"
ACHIEVEMENTS_RESPONSE=$(curl -s "$BASE_URL/api/achievements?limit=5")
if echo "$ACHIEVEMENTS_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "Public achievements retrieved"
else
    print_result 1 "Failed to get public achievements"
fi

echo -e "\n${YELLOW}6. CREATE ACHIEVEMENT${NC}"
echo "------------------------"
ACHIEVEMENT_DATA="{
    \"title\": \"NCC Camp $TIMESTAMP\",
    \"description\": \"Participated in annual training camp\",
    \"category\": \"NCC\",
    \"level\": \"State\",
    \"date\": \"2024-02-12\",
    \"organizer\": \"NCC Directorate\",
    \"isPublic\": true
}"

CREATE_ACHIEVEMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/achievements" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$ACHIEVEMENT_DATA")

if echo "$CREATE_ACHIEVEMENT_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "Achievement created"
    ACHIEVEMENT_ID=$(echo "$CREATE_ACHIEVEMENT_RESPONSE" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    echo "   Achievement ID: $ACHIEVEMENT_ID"
else
    print_result 1 "Failed to create achievement"
    echo "   Response: $CREATE_ACHIEVEMENT_RESPONSE"
fi

if [ -n "$ACHIEVEMENT_ID" ]; then
    echo -e "\n${YELLOW}7. GET SINGLE ACHIEVEMENT${NC}"
    echo "------------------------"
    SINGLE_ACHIEVEMENT_RESPONSE=$(curl -s "$BASE_URL/api/achievements/$ACHIEVEMENT_ID")
    if echo "$SINGLE_ACHIEVEMENT_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "Achievement retrieved"
    else
        print_result 1 "Failed to get achievement"
    fi

    echo -e "\n${YELLOW}8. LIKE ACHIEVEMENT${NC}"
    echo "------------------------"
    LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/achievements/$ACHIEVEMENT_ID/like" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$LIKE_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "Achievement liked"
    else
        print_result 1 "Failed to like achievement"
    fi

    echo -e "\n${YELLOW}9. UPDATE ACHIEVEMENT${NC}"
    echo "------------------------"
    UPDATE_DATA="{
        \"title\": \"Updated NCC Camp $TIMESTAMP\",
        \"description\": \"Updated description\"
    }"
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/achievements/$ACHIEVEMENT_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "$UPDATE_DATA")
    if echo "$UPDATE_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "Achievement updated"
    else
        print_result 1 "Failed to update achievement"
    fi
fi

echo -e "\n${YELLOW}10. GET USER ACHIEVEMENTS${NC}"
echo "------------------------"
if [ -n "$USER_ID" ]; then
    USER_ACHIEVEMENTS_RESPONSE=$(curl -s "$BASE_URL/api/achievements/user/$USER_ID")
    if echo "$USER_ACHIEVEMENTS_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "User achievements retrieved"
    else
        print_result 1 "Failed to get user achievements"
    fi
fi

echo -e "\n${YELLOW}11. GET LEADERBOARD${NC}"
echo "------------------------"
LEADERBOARD_RESPONSE=$(curl -s "$BASE_URL/api/achievements/leaderboard?limit=5")
if echo "$LEADERBOARD_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "Leaderboard retrieved"
else
    print_result 1 "Failed to get leaderboard"
fi

echo -e "\n${YELLOW}12. GET USERS DROPDOWN${NC}"
echo "------------------------"
DROPDOWN_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/users/dropdown")
if echo "$DROPDOWN_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "Users dropdown retrieved"
else
    print_result 1 "Failed to get users dropdown"
fi

echo -e "\n${YELLOW}13. DELETE ACHIEVEMENT${NC}"
echo "------------------------"
if [ -n "$ACHIEVEMENT_ID" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/achievements/$ACHIEVEMENT_ID" \
        -H "Authorization: Bearer $TOKEN")
    if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
        print_result 0 "Achievement deleted"
    else
        print_result 1 "Failed to delete achievement"
    fi
fi

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${GREEN}✅ TESTS PASSED: $PASSED${NC}"
echo -e "${RED}❌ TESTS FAILED: $FAILED${NC}"
echo -e "${YELLOW}📊 TOTAL TESTS: $TOTAL${NC}"
echo -e "${YELLOW}========================================${NC}"