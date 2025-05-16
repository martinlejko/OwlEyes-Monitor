<?php

namespace Tests\Unit\Services;

use Martinlejko\Backend\Services\MonitorService;
use Tests\TestCase;

class MonitorServiceTest extends TestCase
{
    protected $mockDb;
    protected $mockLogger;
    protected $monitorService;

    protected function shouldUseMockDb(): bool
    {
        return true;
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->mockDb         = $this->createMock(\Doctrine\DBAL\Connection::class);
        $this->mockLogger     = $this->container->get('logger');
        $this->monitorService = new MonitorService($this->mockDb, $this->mockLogger);
    }

    public function testGetMonitors()
    {
        // Sample data that should be returned from the database
        $expectedMonitors = [
            [
                'id'           => 1,
                'project_id'   => 1,
                'label'        => 'Main DB Server',
                'periodicity'  => 60,
                'type'         => 'ping',
                'badge_label'  => 'Database',
                'host'         => 'db.example.com',
                'port'         => 5432,
                'url'          => null,
                'check_status' => null,
                'keywords'     => null
            ],
            [
                'id'           => 5,
                'project_id'   => 1,
                'label'        => 'Homepage',
                'periodicity'  => 60,
                'type'         => 'website',
                'badge_label'  => 'Website',
                'host'         => null,
                'port'         => null,
                'url'          => 'https://www.example.com',
                'check_status' => 1,
                'keywords'     => '["welcome", "login"]'
            ]
        ];

        // Create a mock Statement object
        $mockResult = $this->createMock(\Doctrine\DBAL\Result::class);
        $mockResult->expects($this->once())
            ->method('fetchAllAssociative')
            ->willReturn($expectedMonitors);

        // Set up the mock DB to return our mock statement
        $this->mockDb->expects($this->once())
            ->method('executeQuery')
            ->with($this->stringContains('SELECT * FROM monitors'))
            ->willReturn($mockResult);

        // Call the method being tested
        $result = $this->monitorService->getMonitors();

        // Verify the result contains the expected data
        $this->assertCount(2, $result);
        $this->assertEquals(1, $result[0]['id']);
        $this->assertEquals('Main DB Server', $result[0]['label']);
        $this->assertEquals('ping', $result[0]['type']);
        $this->assertEquals('website', $result[1]['type']);
    }

    public function testDeleteMonitor()
    {
        $monitorId = 8;

        // Expect delete to be called with the right table and condition
        $this->mockDb->expects($this->exactly(2))
            ->method('delete')
            ->withConsecutive(
                [
                    $this->equalTo('monitor_status'),
                    $this->callback(function ($condition) use ($monitorId) {
                        return isset($condition['monitor_id']) && $condition['monitor_id'] == $monitorId;
                    })
                ],
                [
                    $this->equalTo('monitors'),
                    $this->callback(function ($condition) use ($monitorId) {
                        return isset($condition['id']) && $condition['id'] == $monitorId;
                    })
                ]
            )
            ->willReturn(1);

        // Call the method being tested
        $result = $this->monitorService->deleteMonitor($monitorId);

        // Verify the result is true
        $this->assertTrue($result);
    }
}
