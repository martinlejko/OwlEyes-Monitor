#!/bin/bash

# Script to run OwlEyes backend tests

# Display usage information
function show_usage {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --all           Run all tests (default)"
    echo "  --unit          Run only unit tests"
    echo "  --integration   Run only integration tests"
    echo "  --simple        Run simple test (for verifying setup)"
    echo "  --api           Run API tests"
    echo "  --coverage      Generate code coverage report"
    echo "  --help          Show this help message"
    exit 1
}

# Set default values
TEST_SUITE="all"
COVERAGE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --all)
            TEST_SUITE="all"
            shift
            ;;
        --unit)
            TEST_SUITE="unit"
            shift
            ;;
        --integration)
            TEST_SUITE="integration"
            shift
            ;;
        --simple)
            TEST_SUITE="simple"
            shift
            ;;
        --api)
            TEST_SUITE="api"
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --help)
            show_usage
            ;;
        *)
            echo "Unknown option: $key"
            show_usage
            ;;
    esac
done

# Ensure we're in the backend directory
cd "$(dirname "$0")"

# Check if we're running in Docker
if [ -f /.dockerenv ] || [ -f /proc/1/cgroup ] && grep -q "docker\|lxc" /proc/1/cgroup; then
    # We're in Docker
    PHPUNIT="./vendor/bin/phpunit"
else
    # We're outside Docker, run in the container
    PHPUNIT="docker exec -it owleyes-backend ./vendor/bin/phpunit"
fi

# Build command
CMD="$PHPUNIT"

# Add coverage if requested
if [ "$COVERAGE" = true ]; then
    CMD="$CMD --coverage-html ./tests/coverage"
fi

# Run tests based on suite
case $TEST_SUITE in
    all)
        echo "Running all tests..."
        $CMD --testdox
        ;;
    unit)
        echo "Running unit tests..."
        $CMD --testsuite Unit --testdox
        ;;
    integration)
        echo "Running integration tests..."
        $CMD --testsuite Integration --testdox
        ;;
    simple)
        echo "Running simple test..."
        $CMD --testsuite Simple --testdox
        ;;
    api)
        echo "Running API tests..."
        $CMD --testsuite Api --testdox
        ;;
esac

# Display results message
echo ""
if [ $? -eq 0 ]; then
    echo "Tests completed successfully!"
    if [ "$COVERAGE" = true ]; then
        echo "Coverage report generated in tests/coverage/"
    fi
else
    echo "Tests failed."
fi 