<?php
/**
 * Simple API test script using curl
 * 
 * This script tests various API endpoints and displays the results.
 * Run with: php tests/CurlTest.php
 */

$apiUrl = 'http://localhost:8000';

// Function to make API calls
function callApi($method, $endpoint, $data = null) {
    global $apiUrl;
    
    $curl = curl_init();
    
    $url = $apiUrl . $endpoint;
    
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
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    curl_close($curl);
    
    return [
        'status' => $status,
        'body' => json_decode($response, true),
        'error' => $error
    ];
}

// Function to run a test and display results
function runTest($name, $method, $endpoint, $data = null) {
    echo "Testing $name... ";
    
    $response = callApi($method, $endpoint, $data);
    
    if ($response['status'] === 0) {
        echo "FAILED: " . $response['error'] . "\n";
        return false;
    } elseif ($response['status'] >= 200 && $response['status'] < 300) {
        echo "SUCCESS (Status: " . $response['status'] . ")\n";
        
        if (!empty($response['body'])) {
            echo "Response: ";
            print_r($response['body']);
            echo "\n";
        }
        
        return $response;
    } else {
        echo "FAILED (Status: " . $response['status'] . ")\n";
        
        if (!empty($response['body'])) {
            echo "Response: ";
            print_r($response['body']);
            echo "\n";
        }
        
        return false;
    }
}

// Test API endpoints
echo "\n=== TESTING API ENDPOINTS ===\n\n";

// Test API connectivity
echo "Checking API connectivity... ";
$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $apiUrl);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_TIMEOUT, 5);
curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($curl, CURLOPT_NOBODY, true);

curl_exec($curl);
$status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
$error = curl_error($curl);
curl_close($curl);

if ($status === 0) {
    echo "FAILED: API is not accessible at $apiUrl: $error\n";
    exit(1);
} else {
    echo "SUCCESS (Status: $status)\n\n";
}

// Test getting projects
$projectsResponse = runTest('List projects', 'GET', '/api/projects');

// Test getting a specific project
if ($projectsResponse && !empty($projectsResponse['body']['data'])) {
    $firstProject = $projectsResponse['body']['data'][0];
    $projectId = $firstProject['id'];
    
    runTest('Get project', 'GET', '/api/projects/' . $projectId);
}

// Test getting monitors
$monitorsResponse = runTest('List monitors', 'GET', '/api/monitors');

// Test getting a specific monitor status
if ($monitorsResponse && !empty($monitorsResponse['body']['data'])) {
    $firstMonitor = $monitorsResponse['body']['data'][0];
    $monitorId = $firstMonitor['id'];
    
    runTest('Get monitor status', 'GET', '/api/monitors/' . $monitorId . '/status');
}

// Test GraphQL API
runTest('GraphQL query', 'POST', '/graphql', [
    'query' => '{ projects { identifier label description } }'
]);

echo "\n=== TESTING COMPLETE ===\n"; 