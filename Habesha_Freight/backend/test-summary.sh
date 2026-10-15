#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "          RUNNING ALL INTEGRATION TESTS"
echo "════════════════════════════════════════════════════════"
echo ""

total_passed=0
total_failed=0

for test_file in src/__tests__/integration/*.test.ts; do
    test_name=$(basename "$test_file" .test.ts)
    echo "📝 Test: $test_name"
    echo "────────────────────────────────────────────────────────"
    
    if NODE_ENV=test npx tsx --test "$test_file" 2>&1; then
        echo "✅ $test_name: PASSED"
        ((total_passed++))
    else
        echo "❌ $test_name: FAILED"
        ((total_failed++))
    fi
    echo ""
    echo "────────────────────────────────────────────────────────"
    echo ""
done

echo "════════════════════════════════════════════════════════"
echo "📊 SUMMARY: $total_passed passed, $total_failed failed"
echo "════════════════════════════════════════════════════════"

if [ $total_failed -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    exit 0
else
    echo "❌ Some tests failed."
    exit 1
fi
