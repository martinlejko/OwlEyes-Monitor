<?php

namespace Tests\Unit\Controllers;

use Martinlejko\Backend\Controllers\BadgeController;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Martinlejko\Backend\Models\Monitor;
use Martinlejko\Backend\Models\MonitorStatus;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\UriFactory;
use Tests\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;

class BadgeControllerTest extends TestCase
{
    /** @var MonitorService&MockObject */
    protected $mockMonitorService;
    /** @var MonitorStatusService&MockObject */
    protected $mockMonitorStatusService;
    protected LoggerInterface $mockLogger;
    protected BadgeController $badgeController;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mockMonitorService = $this->getMockBuilder(MonitorService::class)
                                        ->disableOriginalConstructor()
                                        ->getMock();
        $this->mockMonitorStatusService = $this->getMockBuilder(MonitorStatusService::class)
                                             ->disableOriginalConstructor()
                                             ->getMock();
        $this->mockLogger = $this->container->get('logger');

        $this->badgeController = new BadgeController(
            $this->mockMonitorService,
            $this->mockMonitorStatusService,
            $this->mockLogger
        );
    }

    public function testGetBadge()
    {
        $monitorId = 1;
        $monitor = new Monitor(1, 'Main DB Server', 60, 'ping', 'Database');
        $monitor->setId($monitorId);

        $status = new MonitorStatus($monitorId, new \DateTime(), true, 47);

        $this->mockMonitorService->expects(self::once())
            ->method('find')
            ->with($monitorId)
            ->willReturn($monitor);

        $this->mockMonitorStatusService->expects(self::once())
            ->method('getLatestStatus')
            ->with($monitorId)
            ->willReturn($status);

        $factory = new ServerRequestFactory();
        $uriFactory = new UriFactory();
        $uri = $uriFactory->createUri('http://localhost:8000/badge/' . $monitorId);
        $request = $factory->createServerRequest('GET', $uri);

        $responseFactory = new ResponseFactory();
        $response = $responseFactory->createResponse();

        $args = ['id' => $monitorId];

        $result = $this->badgeController->getBadge($request, $response, $args);

        self::assertEquals(200, $result->getStatusCode());
        self::assertEquals('image/svg+xml', $result->getHeaderLine('Content-Type'));

        $body = (string) $result->getBody();

        self::assertStringContainsString('<svg', $body);
        self::assertStringContainsString('Database', $body);
        self::assertStringContainsString('up', $body);
        self::assertStringContainsString('green', $body);
    }

    public function testGetBadgeForOfflineMonitor()
    {
        $monitorId = 3;
        $monitor = new Monitor(1, 'API Gateway', 60, 'ping', 'API');
        $monitor->setId($monitorId);

        $status = new MonitorStatus($monitorId, new \DateTime(), false, 3000);

        $this->mockMonitorService->expects(self::once())
            ->method('find')
            ->with($monitorId)
            ->willReturn($monitor);

        $this->mockMonitorStatusService->expects(self::once())
            ->method('getLatestStatus')
            ->with($monitorId)
            ->willReturn($status);

        $factory = new ServerRequestFactory();
        $uriFactory = new UriFactory();
        $uri = $uriFactory->createUri('http://localhost:8000/badge/' . $monitorId);
        $request = $factory->createServerRequest('GET', $uri);

        $responseFactory = new ResponseFactory();
        $response = $responseFactory->createResponse();

        $args = ['id' => $monitorId];

        $result = $this->badgeController->getBadge($request, $response, $args);

        self::assertEquals(200, $result->getStatusCode());

        $body = (string) $result->getBody();

        self::assertStringContainsString('<svg', $body);
        self::assertStringContainsString('API', $body);
        self::assertStringContainsString('down', $body);
        self::assertStringContainsString('red', $body);
    }

    public function testGetBadgeForNonExistentMonitor()
    {
        $monitorId = 999;
        $this->mockMonitorService->expects(self::once())
            ->method('find')
            ->with($monitorId)
            ->willReturn(null);

        $factory = new ServerRequestFactory();
        $uriFactory = new UriFactory();
        $uri = $uriFactory->createUri('http://localhost:8000/badge/' . $monitorId);
        $request = $factory->createServerRequest('GET', $uri);

        $responseFactory = new ResponseFactory();
        $response = $responseFactory->createResponse();

        $args = ['id' => $monitorId];

        $result = $this->badgeController->getBadge($request, $response, $args);

        self::assertEquals(200, $result->getStatusCode());
        self::assertStringContainsString('error', (string) $result->getBody());
        self::assertStringContainsString('Monitor not found', (string) $result->getBody());
    }
}
