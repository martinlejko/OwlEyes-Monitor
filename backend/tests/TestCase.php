<?php

namespace Tests;

use PHPUnit\Framework\TestCase as BaseTestCase;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\Constraint\StringContains;
use PHPUnit\Framework\MockObject\Rule\AnyInvokedCount;
use PHPUnit\Framework\MockObject\Rule\InvokedCount;
use DI\Container;
use Doctrine\DBAL\DriverManager;
use Monolog\Handler\NullHandler;
use Monolog\Logger;
use Psr\Log\LoggerInterface;
use Slim\App;
use Martinlejko\Backend\Services\ProjectService;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Martinlejko\Backend\Services\MonitoringService;

abstract class TestCase extends BaseTestCase
{
    protected $container;
    protected $app;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Load environment variables
        $dotenv = \Dotenv\Dotenv::createImmutable(dirname(__DIR__));
        $dotenv->safeLoad();
        
        // Create app
        $this->app = require dirname(__DIR__) . '/src/app.php';
        $this->container = $this->app->getContainer();
        
        // Override logger to prevent output during tests
        $this->container->set('logger', function() {
            $logger = new Logger('test');
            $logger->pushHandler(new NullHandler());
            return $logger;
        });
        
        // Set up mock database connection if needed for unit tests
        if ($this->shouldUseMockDb()) {
            $this->setupMockDb();
        }
    }
    
    protected function shouldUseMockDb(): bool
    {
        return false; // Override in subclasses if needed
    }
    
    protected function setupMockDb(): void
    {
        // Create a mock database connection that can be overridden in tests
        $this->container->set('db', function() {
            return $this->getMockBuilder(\Doctrine\DBAL\Connection::class)
                        ->disableOriginalConstructor()
                        ->getMock();
        });
    }
    
    /**
     * Helper method to create a mock of a specified class
     * 
     * @param string $className The class to mock
     * @return MockObject The mocked object
     */
    protected function createMock(string $className): MockObject
    {
        return $this->getMockBuilder($className)
                    ->disableOriginalConstructor()
                    ->getMock();
    }
    
    /**
     * Create a service with mocked database connection
     * 
     * @param string $serviceClass The service class to create
     * @param mixed $mockDb The mock database connection, or null to create one
     * @param mixed $logger The logger, or null to use the container logger
     * @return object The service instance
     */
    protected function createServiceWithMockDb($serviceClass, $mockDb = null, $logger = null)
    {
        if ($mockDb === null) {
            $mockDb = $this->getMockBuilder(\Doctrine\DBAL\Connection::class)
                           ->disableOriginalConstructor()
                           ->getMock();
        }
        
        if ($logger === null) {
            $logger = $this->container->get('logger');
        }
        
        return new $serviceClass($mockDb, $logger);
    }
    
    /**
     * Helper method for string contains constraint
     */
    protected function stringContains(string $value)
    {
        return parent::stringContains($value);
    }
    
    /**
     * Helper to check if things are equal
     */
    public static function equalTo($value)
    {
        return parent::equalTo($value);
    }
    
    /**
     * Helper for asserting a specific number of calls
     */
    public static function exactly(int $count): InvokedCount
    {
        return parent::exactly($count);
    }
    
    /**
     * Helper method for the any constraint
     */
    public static function any(): AnyInvokedCount
    {
        return parent::any();
    }
    
    /**
     * Helper method for the once constraint
     */
    public static function once(): InvokedCount
    {
        return parent::once();
    }
} 