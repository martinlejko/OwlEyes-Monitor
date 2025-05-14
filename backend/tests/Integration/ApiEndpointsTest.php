<?php

namespace Tests\Integration;

use Tests\TestCase;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\UriFactory;
use Slim\Psr7\Factory\StreamFactory;

class ApiEndpointsTest extends TestCase
{
    protected function shouldUseMockDb(): bool
    {
        return false; // Use actual database for integration tests
    }
    
    /**
     * Helper method to create a request
     */
    protected function createRequest(string $method, string $path, array $queryParams = [], array $body = []): \Slim\Psr7\Request
    {
        $factory = new ServerRequestFactory();
        $uriFactory = new UriFactory();
        $uri = $uriFactory->createUri('http://localhost:8000' . $path);
        
        $request = $factory->createServerRequest($method, $uri);
        
        if (!empty($queryParams)) {
            $request = $request->withQueryParams($queryParams);
        }
        
        if (!empty($body)) {
            $streamFactory = new StreamFactory();
            $stream = $streamFactory->createStream(json_encode($body));
            $request = $request->withBody($stream);
            $request = $request->withHeader('Content-Type', 'application/json');
        }
        
        return $request;
    }
    
    /**
     * Helper method to send a request and get a response
     */
    protected function sendRequest($request)
    {
        // Process the request with the app
        $response = $this->app->handle($request);
        
        // Parse the response body if it's JSON
        $body = (string) $response->getBody();
        
        if (strpos($response->getHeaderLine('Content-Type'), 'application/json') === 0) {
            $body = json_decode($body, true);
        }
        
        return [
            'status' => $response->getStatusCode(),
            'headers' => $response->getHeaders(),
            'body' => $body
        ];
    }
    
    public function testGetProjects()
    {
        $request = $this->createRequest('GET', '/api/projects');
        $response = $this->sendRequest($request);
        
        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertGreaterThan(0, count($response['body']['data']));
        
        // Check structure of the first project
        $firstProject = $response['body']['data'][0];
        $this->assertArrayHasKey('id', $firstProject);
        $this->assertArrayHasKey('label', $firstProject);
        $this->assertArrayHasKey('description', $firstProject);
        $this->assertArrayHasKey('tags', $firstProject);
    }
    
    public function testGetMonitors()
    {
        $request = $this->createRequest('GET', '/api/monitors');
        $response = $this->sendRequest($request);
        
        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertGreaterThan(0, count($response['body']['data']));
        
        // Check structure of the first monitor
        $firstMonitor = $response['body']['data'][0];
        $this->assertArrayHasKey('id', $firstMonitor);
        $this->assertArrayHasKey('projectId', $firstMonitor);
        $this->assertArrayHasKey('label', $firstMonitor);
        $this->assertArrayHasKey('type', $firstMonitor);
    }
    
    public function testGetMonitorStatus()
    {
        // First get a monitor ID to use
        $request = $this->createRequest('GET', '/api/monitors');
        $response = $this->sendRequest($request);
        $monitorId = $response['body']['data'][0]['id'];
        
        // Test getting status for this monitor
        $request = $this->createRequest('GET', '/api/monitors/' . $monitorId . '/status');
        $response = $this->sendRequest($request);
        
        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        
        if (count($response['body']['data']) > 0) {
            $firstStatus = $response['body']['data'][0];
            $this->assertArrayHasKey('id', $firstStatus);
            $this->assertArrayHasKey('monitorId', $firstStatus);
            $this->assertArrayHasKey('startTime', $firstStatus);
            $this->assertArrayHasKey('status', $firstStatus);
            $this->assertArrayHasKey('responseTime', $firstStatus);
        }
    }
    
    public function testDeleteMonitor()
    {
        // First get all monitors to find the last one to delete
        $request = $this->createRequest('GET', '/api/monitors');
        $response = $this->sendRequest($request);
        
        if (count($response['body']['data']) < 1) {
            $this->markTestSkipped('No monitors available to delete');
        }
        
        // Get the last monitor to minimize impact
        $monitors = $response['body']['data'];
        $lastMonitor = end($monitors);
        $monitorId = $lastMonitor['id'];
        
        // Delete the monitor
        $request = $this->createRequest('DELETE', '/api/monitors/' . $monitorId);
        $response = $this->sendRequest($request);
        
        $this->assertEquals(200, $response['status']);
        
        // Verify it's deleted by trying to fetch it
        $request = $this->createRequest('GET', '/api/monitors/' . $monitorId);
        $response = $this->sendRequest($request);
        
        // Should either return 404 or empty data
        if ($response['status'] === 200) {
            $this->assertEmpty($response['body']['data']);
        } else {
            $this->assertEquals(404, $response['status']);
        }
    }
} 