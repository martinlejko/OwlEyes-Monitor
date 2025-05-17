<?php

namespace Tests\Integration;

use Martinlejko\Backend\Models\Monitor;
use Martinlejko\Backend\Models\MonitorStatus;
use Martinlejko\Backend\Services\MonitoringService;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

class PingMonitorTest extends TestCase
{
    /** @var MonitoringService|MockObject */
    private $monitoringService;
    private Monitor $testMonitor;

    protected function setUp(): void
    {
        /** @var MonitorService|MockObject $monitorService */
        $monitorService = $this->createMock(MonitorService::class);
        /** @var MonitorStatusService|MockObject $statusService */
        $statusService = $this->createMock(MonitorStatusService::class);
        $logger        = new NullLogger();

        $this->monitoringService = $this->getMockBuilder(MonitoringService::class)
            ->setConstructorArgs([$monitorService, $statusService, $logger])
            ->onlyMethods(['checkMonitor'])
            ->getMock();

        $this->monitoringService->expects($this->any())
            ->method('checkMonitor')
            ->willReturn(new MonitorStatus(1, new \DateTime(), true, 100));

        $this->testMonitor = new Monitor(1, 'Test Ping Monitor', 60, 'ping', 'test-badge');
        $this->testMonitor->setId(1);
        $this->testMonitor->setHost('127.0.0.1');
        $this->testMonitor->setPort(80);

        $monitorService->method('find')->willReturn($this->testMonitor);
    }

    public function testPingMonitor(): void
    {
        $status = $this->monitoringService->checkMonitor($this->testMonitor->getId());

        $this->assertNotNull($status);
        $this->assertTrue($status->getStatus(), 'The ping monitor should be UP');
        $this->assertGreaterThan(0, $status->getResponseTime(), 'Response time should be greater than 0');
    }
}
