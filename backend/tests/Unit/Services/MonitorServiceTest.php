<?php

namespace Tests\Unit\Services;

use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Models\Monitor;
use Tests\TestCase;
use Doctrine\DBAL\Connection;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;

class MonitorServiceTest extends TestCase
{
    /** @var Connection&MockObject */
    protected $mockDb;
    protected LoggerInterface $mockLogger;
    protected MonitorService $monitorService;

    protected function shouldUseMockDb(): bool
    {
        return true;
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->mockDb = $this->getMockBuilder(Connection::class)
                              ->disableOriginalConstructor()
                              ->getMock();
        $this->mockLogger = $this->container->get('logger');
        $this->monitorService = new MonitorService($this->mockDb, $this->mockLogger);
    }

    public function testFindAll()
    {
        // Sample data that should be returned from the database
        $expectedMonitors = [
            [
                'id' => 1,
                'project_id' => 1,
                'label' => 'Main DB Server',
                'periodicity' => 60,
                'type' => 'ping',
                'badge_label' => 'Database',
                'host' => 'db.example.com',
                'port' => 5432,
                'url' => null,
                'check_status' => null,
                'keywords' => null
            ],
            [
                'id' => 5,
                'project_id' => 1,
                'label' => 'Homepage',
                'periodicity' => 60,
                'type' => 'website',
                'badge_label' => 'Website',
                'host' => null,
                'port' => null,
                'url' => 'https://www.example.com',
                'check_status' => 1,
                'keywords' => '["welcome", "login"]'
            ]
        ];

        // Mock the query builder
        $mockQueryBuilder = $this->getMockBuilder(\Doctrine\DBAL\Query\QueryBuilder::class)
                                ->disableOriginalConstructor()
                                ->getMock();

        $mockQueryBuilder->expects(self::any())->method('select')->willReturnSelf();
        $mockQueryBuilder->expects(self::any())->method('from')->willReturnSelf();
        $mockQueryBuilder->expects(self::any())->method('setMaxResults')->willReturnSelf();
        $mockQueryBuilder->expects(self::any())->method('setFirstResult')->willReturnSelf();

        // Create a mock Result object
        $mockResult = $this->getMockBuilder(\Doctrine\DBAL\Result::class)
                          ->disableOriginalConstructor()
                          ->getMock();
        $mockResult->expects(self::once())
                  ->method('fetchAllAssociative')
                  ->willReturn($expectedMonitors);

        $mockQueryBuilder->expects(self::once())
                        ->method('executeQuery')
                        ->willReturn($mockResult);

        // Set up the mock DB to return our mock query builder
        $this->mockDb->expects(self::once())
                     ->method('createQueryBuilder')
                     ->willReturn($mockQueryBuilder);

        // Call the method being tested
        $result = $this->monitorService->findAll(1, 10);

        // Verify the result contains the expected data
        self::assertCount(2, $result);
        self::assertInstanceOf(Monitor::class, $result[0]);
        self::assertEquals(1, $result[0]->getId());
        self::assertEquals('Main DB Server', $result[0]->getLabel());
        self::assertEquals('ping', $result[0]->getType());
        self::assertEquals('website', $result[1]->getType());
    }

    public function testDelete()
    {
        $monitorId = 8;

        // Expect delete to be called with the right table and condition
        $this->mockDb->expects(self::once())
                     ->method('delete')
                     ->with(
                         self::equalTo('monitors'),
                         self::callback(function ($condition) use ($monitorId) {
                             return isset($condition['id']) && $condition['id'] == $monitorId;
                         })
                     )
                     ->willReturn(1);

        // Call the method being tested
        $result = $this->monitorService->delete($monitorId);

        // Verify the result is true
        self::assertTrue($result);
    }
}
