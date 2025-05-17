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
        // Mock monitor data
        $monitorId = 1;
        $monitor = new Monitor(1, 'Main DB Server', 60, 'ping', 'Database');
        $monitor->setId($monitorId);

        // Mock latest status data
        $status = new MonitorStatus($monitorId, new \DateTime(), true, 47);

        // Set up expectations for monitor service
        $this->mockMonitorService->expects(self::once())
            ->method('find')
            ->with($monitorId)
            ->willReturn($monitor);

        // Set up expectations for monitor status service
        $this->mockMonitorStatusService->expects(self::once())
            ->method('getLatestStatus')
            ->with($monitorId)
            ->willReturn($status);

        // Create request
        $factory = new ServerRequestFactory();
        $uriFactory = new UriFactory();
        $uri = $uriFactory->createUri('http://localhost:8000/badge/' . $monitorId);
        $request = $factory->createServerRequest('GET', $uri);

        // Create response
        $responseFactory = new ResponseFactory();
        $response = $responseFactory->createResponse();

        // Create route arguments with monitor id
        $args = ['id' => $monitorId];

        // Call the method being tested
        $result = $this->badgeController->getBadge($request, $response, $args);

        // Assert response
        self::assertEquals(200, $result->getStatusCode());
        self::assertEquals('image/svg+xml', $result->getHeaderLine('Content-Type'));

        // Get response body content
        $body = (string) $result->getBody();

        // Assert SVG content
        self::assertStringContainsString('<svg', $body);
        self::assertStringContainsString('Database', $body);
        self::assertStringContainsString('up', $body);
        self::assertStringContainsString('green', $body);
    }

    public function testGetBadgeForOfflineMonitor()
    {
        // Mock monitor data
        $monitorId = 3;
        $monitor = new Monitor(1, 'API Gateway', 60, 'ping', 'API');
        $monitor->setId($monitorId);

        // Mock latest status data - service is DOWN
        $status = new MonitorStatus($monitorId, new \DateTime(), false, 3000);

        // Set up expectations for monitor service
        $this->mockMonitorService->expects(self::once())
            ->method('find')
            ->with($monitorId)
            ->willReturn($monitor);

        // Set up expectations for monitor status service
        $this->mockMonitorStatusService->expects(self::once())
            ->method('getLatestStatus')
            ->with($monitorId)
            ->willReturn($status);

        // Create request
        $factory = new ServerRequestFactory();
        $uriFactory = new UriFactory();
        $uri = $uriFactory->createUri('http://localhost:8000/badge/' . $monitorId);
        $request = $factory->createServerRequest('GET', $uri);

        // Create response
        $responseFactory = new ResponseFactory();
        $response = $responseFactory->createResponse();

        // Create route arguments with monitor id
        $args = ['id' => $monitorId];

        // Call the method being tested
        $result = $this->badgeController->getBadge($request, $response, $args);

        // Assert response
        self::assertEquals(200, $result->getStatusCode());

        // Get response body content
        $body = (string) $result->getBody();

        // Assert SVG content
        self::assertStringContainsString('<svg', $body);
        self::assertStringContainsString('API', $body);
        self::assertStringContainsString('down', $body);
        self::assertStringContainsString('red', $body);
    }

    public function testGetBadgeForNonExistentMonitor()
    {
        // Mock monitor service to return null for a non-existent monitor
        $monitorId = 999;
        $this->mockMonitorService->expects(self::once())
            ->method('find')
            ->with($monitorId)
            ->willReturn(null);

        // Create request
        $factory = new ServerRequestFactory();
        $uriFactory = new UriFactory();
        $uri = $uriFactory->createUri('http://localhost:8000/badge/' . $monitorId);
        $request = $factory->createServerRequest('GET', $uri);

        // Create response
        $responseFactory = new ResponseFactory();
        $response = $responseFactory->createResponse();

        // Create route arguments with monitor id
        $args = ['id' => $monitorId];

        // Call the method being tested
        $result = $this->badgeController->getBadge($request, $response, $args);

        // Assert response
        self::assertEquals(200, $result->getStatusCode());
        self::assertStringContainsString('error', (string) $result->getBody());
        self::assertStringContainsString('Monitor not found', (string) $result->getBody());
    }
}
