<?php

namespace Tests\Integration;

use Tests\ApiTest;

class ApiEndpointsTest extends ApiTest
{
    public function testGetProjects()
    {
        $response = $this->callApi('GET', '/api/projects');

        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertGreaterThan(0, count($response['body']['data']));

        // Check structure of the first project
        $firstProject = $response['body']['data'][0];
        $this->assertArrayHasKey('id', $firstProject);
        $this->assertArrayHasKey('label', $firstProject);
        $this->assertArrayHasKey('description', $firstProject);
        $this->assertArrayHasKey('tags', $firstProject);

        return $firstProject['id'];
    }

    public function testGetMonitors()
    {
        $response = $this->callApi('GET', '/api/monitors');

        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertGreaterThan(0, count($response['body']['data']));

        // Check structure of the first monitor
        $firstMonitor = $response['body']['data'][0];
        $this->assertArrayHasKey('id', $firstMonitor);
        $this->assertArrayHasKey('projectId', $firstMonitor);
        $this->assertArrayHasKey('label', $firstMonitor);
        $this->assertArrayHasKey('type', $firstMonitor);

        return $firstMonitor['id'];
    }

    /**
     * @depends testGetMonitors
     */
    public function testGetMonitorStatus($monitorId)
    {
        $response = $this->callApi('GET', '/api/monitors/' . $monitorId . '/status');

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

    /**
     * @depends testGetMonitors
     */
    public function testDeleteMonitor($monitorId)
    {
        // Delete the monitor
        $response = $this->callApi('DELETE', '/api/monitors/' . $monitorId);
        $this->assertEquals(204, $response['status']);

        // Verify it's deleted by trying to fetch it
        $response = $this->callApi('GET', '/api/monitors/' . $monitorId);

        // Should either return 404 or empty data
        if ($response['status'] === 200) {
            $this->assertEmpty($response['body']['data']);
        } else {
            $this->assertEquals(404, $response['status']);
        }
    }
}
