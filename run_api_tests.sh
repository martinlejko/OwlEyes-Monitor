#!/bin/bash

# Script to run API tests for OwlEyes

echo "=== OwlEyes API Test Runner ==="
echo

# Ensure backend container is running
echo "Checking if backend container is running..."
if ! docker ps | grep owleyes-backend > /dev/null; then
    echo "Backend container is not running. Starting containers..."
    docker-compose up -d
    
    # Wait for containers to be ready
    echo "Waiting for containers to be ready..."
    sleep 10
else
    echo "Backend container is already running."
fi

# Run the API test script
echo
echo "Running API tests..."
php backend/tests/CurlTest.php

# Check the exit code
if [ $? -eq 0 ]; then
    echo
    echo "✅ All API tests PASSED!"
    exit 0
else
    echo
    echo "❌ Some API tests FAILED!"
    exit 1
fi 