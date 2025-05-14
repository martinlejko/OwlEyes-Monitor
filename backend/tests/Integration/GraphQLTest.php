<?php

namespace Tests\Integration;

use Tests\TestCase;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Factory\UriFactory;
use Slim\Psr7\Factory\StreamFactory;

class GraphQLTest extends TestCase
{
    protected function shouldUseMockDb(): bool
    {
        return false; // Use actual database for integration tests
    }
    
    /**
     * Helper method to send a GraphQL query
     */
    protected function sendGraphQLQuery(string $query, array $variables = []): array
    {
        $factory = new ServerRequestFactory();
        $uriFactory = new UriFactory();
        $uri = $uriFactory->createUri('http://localhost:8000/graphql');
        
        $request = $factory->createServerRequest('POST', $uri);
        
        $streamFactory = new StreamFactory();
        $data = ['query' => $query];
        
        if (!empty($variables)) {
            $data['variables'] = $variables;
        }
        
        $stream = $streamFactory->createStream(json_encode($data));
        $request = $request->withBody($stream);
        $request = $request->withHeader('Content-Type', 'application/json');
        
        // Process the request with the app
        $response = $this->app->handle($request);
        
        // Parse the response body
        $body = (string) $response->getBody();
        $body = json_decode($body, true);
        
        return [
            'status' => $response->getStatusCode(),
            'headers' => $response->getHeaders(),
            'body' => $body
        ];
    }
    
    public function testGetProjects()
    {
        $query = '{ projects { identifier label description } }';
        $response = $this->sendGraphQLQuery($query);
        
        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertArrayHasKey('projects', $response['body']['data']);
        $this->assertNotEmpty($response['body']['data']['projects']);
        
        // Check structure of the first project
        $firstProject = $response['body']['data']['projects'][0];
        $this->assertArrayHasKey('identifier', $firstProject);
        $this->assertArrayHasKey('label', $firstProject);
        $this->assertArrayHasKey('description', $firstProject);
    }
    
    public function testGetProjectsWithMonitors()
    {
        $query = '{ projects { identifier label monitors { identifier type label } } }';
        $response = $this->sendGraphQLQuery($query);
        
        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertArrayHasKey('projects', $response['body']['data']);
        $this->assertNotEmpty($response['body']['data']['projects']);
        
        // Check structure of the first project
        $firstProject = $response['body']['data']['projects'][0];
        $this->assertArrayHasKey('monitors', $firstProject);
        
        // At least one project should have monitors
        $hasMonitors = false;
        foreach ($response['body']['data']['projects'] as $project) {
            if (!empty($project['monitors'])) {
                $hasMonitors = true;
                
                // Check structure of the first monitor
                $firstMonitor = $project['monitors'][0];
                $this->assertArrayHasKey('identifier', $firstMonitor);
                $this->assertArrayHasKey('type', $firstMonitor);
                $this->assertArrayHasKey('label', $firstMonitor);
                break;
            }
        }
        
        $this->assertTrue($hasMonitors, 'At least one project should have monitors');
    }
    
    public function testGetMonitorStatus()
    {
        // First get a monitor ID to use
        $projectsQuery = '{ projects { identifier monitors { identifier } } }';
        $projectsResponse = $this->sendGraphQLQuery($projectsQuery);
        
        $monitorId = null;
        foreach ($projectsResponse['body']['data']['projects'] as $project) {
            if (!empty($project['monitors'])) {
                $monitorId = $project['monitors'][0]['identifier'];
                break;
            }
        }
        
        if ($monitorId === null) {
            $this->markTestSkipped('No monitors available to test');
        }
        
        // Test getting status for this monitor
        $query = "{ status(monitorIdentifier: \"$monitorId\") { date ok responseTime } }";
        $response = $this->sendGraphQLQuery($query);
        
        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertArrayHasKey('status', $response['body']['data']);
        
        if (!empty($response['body']['data']['status'])) {
            $firstStatus = $response['body']['data']['status'][0];
            $this->assertArrayHasKey('date', $firstStatus);
            $this->assertArrayHasKey('ok', $firstStatus);
            $this->assertArrayHasKey('responseTime', $firstStatus);
        }
    }
} 