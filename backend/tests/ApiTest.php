<?php

namespace Tests;

use PHPUnit\Framework\TestCase;

class ApiTest extends TestCase
{
    private $apiUrl = 'http://localhost:8000';

    protected function setUp(): void
    {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $this->apiUrl);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_TIMEOUT, 5);
        curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($curl, CURLOPT_NOBODY, true);

        curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($status === 0) {
            $this->markTestSkipped('API is not accessible at ' . $this->apiUrl);
        }
    }

    protected function callApi($method, $endpoint, $data = null)
    {
        $curl = curl_init();

        $url = $this->apiUrl . $endpoint;

        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($curl, CURLOPT_TIMEOUT, 5);
        curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 5);

        if ($data !== null) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($curl, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen(json_encode($data))
            ]);
        }

        $response = curl_exec($curl);
        $status   = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error    = curl_error($curl);

        curl_close($curl);

        if ($status === 0) {
            $this->fail("API call failed: $error");
        }

        return [
            'status' => $status,
            'body'   => json_decode($response, true) ?? ['error' => 'Invalid JSON response: ' . substr($response, 0, 100)]
        ];
    }

    public function testListProjects()
    {
        $response = $this->callApi('GET', '/api/projects');

        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertNotEmpty($response['body']['data']);

        $firstProject = $response['body']['data'][0];
        $this->assertArrayHasKey('id', $firstProject);
        $this->assertArrayHasKey('label', $firstProject);
        $this->assertArrayHasKey('description', $firstProject);
        $this->assertArrayHasKey('tags', $firstProject);

        return $firstProject['id'];
    }

    /**
     * @depends testListProjects
     */
    public function testGetProject($projectId)
    {
        $response = $this->callApi('GET', '/api/projects/' . $projectId);

        $this->assertEquals(200, $response['status']);
        $this->assertIsArray($response['body']);
        $this->assertEquals($projectId, $response['body']['id']);
    }

    public function testListMonitors()
    {
        $response = $this->callApi('GET', '/api/monitors');

        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);

        if (!empty($response['body']['data'])) {
            $firstMonitor = $response['body']['data'][0];
            $this->assertArrayHasKey('id', $firstMonitor);
            $this->assertArrayHasKey('projectId', $firstMonitor);
            $this->assertArrayHasKey('label', $firstMonitor);
            $this->assertArrayHasKey('type', $firstMonitor);

            return $firstMonitor['id'];
        }

        $this->markTestSkipped('No monitors found to test with');
    }

    /**
     * @depends testListMonitors
     */
    public function testGetMonitorStatus($monitorId)
    {
        if (!$monitorId) {
            $this->markTestSkipped('No monitor ID available');
        }

        $response = $this->callApi('GET', '/api/monitors/' . $monitorId . '/status');

        $this->assertEquals(200, $response['status']);
        $this->assertArrayHasKey('data', $response['body']);
    }
}
