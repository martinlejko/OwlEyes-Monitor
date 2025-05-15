<?php

use DI\Container;
use Martinlejko\Backend\Services\MonitoringService;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;

require __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Create Container
$container = new Container();

// Set up logger
$logger = new Logger('monitor-check');
$logFile = __DIR__ . '/logs/monitor_checks.log';
$logger->pushHandler(new StreamHandler($logFile, Logger::INFO));
$logger->pushHandler(new StreamHandler(STDOUT, Logger::INFO));

$logger->info('Starting monitor checks');

try {
    // Set up database connection
    $dbParams = [
        'dbname' => $_ENV['DB_NAME'],
        'user' => $_ENV['DB_USER'],
        'password' => $_ENV['DB_PASSWORD'],
        'host' => $_ENV['DB_HOST'],
        'driver' => 'pdo_pgsql',
    ];
    
    $db = Doctrine\DBAL\DriverManager::getConnection($dbParams);
    
    // Create services
    $projectService = new Martinlejko\Backend\Services\ProjectService($db, $logger);
    $monitorService = new Martinlejko\Backend\Services\MonitorService($db, $logger);
    $statusService = new Martinlejko\Backend\Services\MonitorStatusService($db, $logger);
    $monitoringService = new MonitoringService($monitorService, $statusService, $logger);
    
    // Get monitors due for check
    $monitors = $monitoringService->getMonitorsDueForCheck();
    $logger->info('Found ' . count($monitors) . ' monitors to check');
    
    // Check each monitor
    foreach ($monitors as $monitor) {
        $logger->info("Checking monitor: {$monitor->getLabel()} (ID: {$monitor->getId()})");
        $status = $monitoringService->checkMonitor($monitor->getId());
        
        if ($status) {
            $statusText = $status->getStatus() ? "UP" : "DOWN";
            $logger->info("Monitor {$monitor->getLabel()} status: {$statusText}");
        } else {
            $logger->error("Failed to check monitor {$monitor->getLabel()}");
        }
    }
    
    $logger->info('Monitor checks completed');
} catch (Exception $e) {
    $logger->error('Error running monitor checks: ' . $e->getMessage());
    exit(1);
} 