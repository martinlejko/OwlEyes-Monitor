<?php

namespace Tests\Unit\Controllers;

use Tests\TestCase;
use Martinlejko\Backend\Controllers\BadgeController;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\UriFactory;
use Slim\Psr7\Factory\ResponseFactory;

class BadgeControllerTest extends TestCase
{
    protected $mockMonitorService;
    protected $mockMonitorStatusService;
    protected $mockLogger;
    protected $badgeController;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockMonitorService = $this->createMock(MonitorService::class);
        $this->mockMonitorStatusService = $this->createMock(MonitorStatusService::class);
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
        $mockMonitor = [
            'id' => $monitorId,
            'badge_label' => 'Database',
            'label' => 'Main DB Server'
        ];
        
        // Mock latest status data
        $mockStatus = [
            'id' => 9,
            'monitor_id' => $monitorId,
            'status' => true,
            'response_time' => 47,
            'start_time' => '2025-05-14 19:53:52'
        ];
        
        // Set up expectations for monitor service
        $this->mockMonitorService->expects($this->once())
            ->method('getMonitor')
            ->with($monitorId)
            ->willReturn($mockMonitor);
            
        // Set up expectations for monitor status service
        $this->mockMonitorStatusService->expects($this->once())
            ->method('getLatestStatus')
            ->with($monitorId)
            ->willReturn($mockStatus);
            
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
        $this->assertEquals(200, $result->getStatusCode());
        $this->assertEquals('image/svg+xml', $result->getHeaderLine('Content-Type'));
        
        // Get response body content
        $body = (string) $result->getBody();
        
        // Assert SVG content
        $this->assertStringContainsString('<svg', $body);
        $this->assertStringContainsString('Database', $body);
        $this->assertStringContainsString('UP', $body);
        $this->assertStringContainsString('47ms', $body);
        $this->assertStringContainsString('#4c1', $body); // Green color for UP status
    }
    
    public function testGetBadgeForOfflineMonitor()
    {
        // Mock monitor data
        $monitorId = 3;
        $mockMonitor = [
            'id' => $monitorId,
            'badge_label' => 'API',
            'label' => 'API Gateway'
        ];
        
        // Mock latest status data - service is DOWN
        $mockStatus = [
            'id' => 12,
            'monitor_id' => $monitorId,
            'status' => false,
            'response_time' => 3000,
            'start_time' => '2025-05-14 08:53:52'
        ];
        
        // Set up expectations for monitor service
        $this->mockMonitorService->expects($this->once())
            ->method('getMonitor')
            ->with($monitorId)
            ->willReturn($mockMonitor);
            
        // Set up expectations for monitor status service
        $this->mockMonitorStatusService->expects($this->once())
            ->method('getLatestStatus')
            ->with($monitorId)
            ->willReturn($mockStatus);
            
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
        $this->assertEquals(200, $result->getStatusCode());
        
        // Get response body content
        $body = (string) $result->getBody();
        
        // Assert SVG content
        $this->assertStringContainsString('<svg', $body);
        $this->assertStringContainsString('API', $body);
        $this->assertStringContainsString('DOWN', $body);
        $this->assertStringContainsString('#e05d44', $body); // Red color for DOWN status
    }
    
    public function testGetBadgeForNonExistentMonitor()
    {
        // Mock monitor service to return null for a non-existent monitor
        $monitorId = 999;
        $this->mockMonitorService->expects($this->once())
            ->method('getMonitor')
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
        $this->assertEquals(404, $result->getStatusCode());
    }
} 