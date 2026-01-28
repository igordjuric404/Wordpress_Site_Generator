#!/bin/bash

# Test WP-CLI memory limit fix
echo "Testing WP-CLI with increased memory limit..."
echo ""

# Create temp directory
TEST_DIR="/tmp/wp-cli-memory-test-$$"
mkdir -p "$TEST_DIR"

echo "Test directory: $TEST_DIR"
echo ""

# Try downloading WordPress with memory limit
echo "Attempting to download WordPress with 512M memory limit..."
WP_CLI_PHP_ARGS="-d memory_limit=512M" wp core download --path="$TEST_DIR" --locale=en_US

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! WordPress downloaded with 512M memory limit"
    echo "Cleaning up..."
    rm -rf "$TEST_DIR"
    echo "✅ Test passed!"
    exit 0
else
    echo ""
    echo "❌ FAILED: WordPress download failed even with 512M memory"
    echo "Cleaning up..."
    rm -rf "$TEST_DIR"
    exit 1
fi
