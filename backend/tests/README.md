# OwlEyes Backend Tests

This directory contains tests for the OwlEyes backend API. The tests are organized into two main categories:

## Test Structure

1. **Unit Tests** (`/tests/Unit`): These tests focus on individual components in isolation, with dependencies mocked.
   - `/Services`: Tests for service classes (ProjectService, MonitorService, etc.)
   - `/Controllers`: Tests for controller classes

2. **Integration Tests** (`/tests/Integration`): These tests focus on testing API endpoints and interactions between components.
   - `ApiEndpointsTest.php`: Tests REST API endpoints
   - `GraphQLTest.php`: Tests GraphQL API endpoint

## Running Tests

You can run the tests using Composer scripts:

```bash
# Run all tests
composer test

# Run only unit tests
composer test:unit

# Run only integration tests
composer test:integration
```

## Requirements for Integration Tests

For the integration tests to work:
- The PostgreSQL database must be running and accessible
- The database should be seeded with test data
- The `.env` file must be properly configured with database connection details

## Writing New Tests

- Extend the `Tests\TestCase` class for all tests
- For unit tests, override `shouldUseMockDb()` to return `true` to use mocked database
- For integration tests, override `shouldUseMockDb()` to return `false` to use the real database

### Example Test

```php
<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use Martinlejko\Backend\Services\YourService;

class YourServiceTest extends TestCase
{
    protected function shouldUseMockDb(): bool
    {
        return true; // Use mock database for unit tests
    }
    
    protected function setUp(): void
    {
        parent::setUp();
        // Set up your test...
    }
    
    public function testYourMethod()
    {
        // Arrange
        // ...
        
        // Act
        // ...
        
        // Assert
        // ...
    }
} 