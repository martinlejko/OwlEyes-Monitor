<?php

namespace Tests;

use Monolog\Handler\NullHandler;
use Monolog\Logger;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Rule\AnyInvokedCount;
use PHPUnit\Framework\MockObject\Rule\InvokedCount;
use PHPUnit\Framework\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected $container;
    protected $app;

    protected function setUp(): void
    {
        parent::setUp();

        $dotenv = \Dotenv\Dotenv::createImmutable(dirname(__DIR__));
        $dotenv->safeLoad();

        $this->app       = require dirname(__DIR__) . '/src/app.php';
        $this->container = $this->app->getContainer();

        $this->container->set('logger', function () {
            $logger = new Logger('test');
            $logger->pushHandler(new NullHandler());

            return $logger;
        });

        if ($this->shouldUseMockDb()) {
            $this->setupMockDb();
        }
    }

    protected function shouldUseMockDb(): bool
    {
        return false;
    }

    protected function setupMockDb(): void
    {
        $this->container->set('db', function () {
            return $this->getMockBuilder(\Doctrine\DBAL\Connection::class)
                        ->disableOriginalConstructor()
                        ->getMock();
        });
    }

    protected function createMock(string $className): MockObject
    {
        return $this->getMockBuilder($className)
                    ->disableOriginalConstructor()
                    ->getMock();
    }

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

    public static function stringContains(string $string, bool $ignoreCase = false): \PHPUnit\Framework\Constraint\StringContains
    {
        return new \PHPUnit\Framework\Constraint\StringContains($string, $ignoreCase);
    }

    public static function equalTo(mixed $value): \PHPUnit\Framework\Constraint\IsEqual
    {
        return parent::equalTo($value);
    }

    public static function exactly(int $count): InvokedCount
    {
        return parent::exactly($count);
    }

    public static function any(): AnyInvokedCount
    {
        return parent::any();
    }

    public static function once(): InvokedCount
    {
        return parent::once();
    }
}
