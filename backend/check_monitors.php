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

$logger->info('Starting monitor checks loop');

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
    
    // Initial monitor data load
    $allMonitors = $monitorService->findAll(1, 1000);
    $logger->info('Found ' . count($allMonitors) . ' total monitors in the system');
    
    // Track monitor configs by ID for easy refresh
    $monitorConfigs = [];
    foreach ($allMonitors as $monitor) {
        $monitorConfigs[$monitor->getId()] = $monitor;
    }
    
    // Calculate next check time for each monitor
    $nextCheckTime = [];
    foreach ($monitorConfigs as $monitorId => $monitor) {
        $latestStatus = $statusService->getLatestStatus($monitorId);
        
        if ($latestStatus) {
            // Calculate next check time based on last check time + periodicity
            $lastCheckTime = $latestStatus->getStartTime()->getTimestamp();
            $nextCheckTime[$monitorId] = $lastCheckTime + $monitor->getPeriodicity();
        } else {
            // If never checked before, schedule immediately
            $nextCheckTime[$monitorId] = time();
        }
    }
    
    // Run for approximately 58 seconds (leaving 2 seconds buffer before next cron run)
    $endTime = time() + 58;
    $iterations = 0;
    $lastConfigRefresh = time();
    
    while (time() < $endTime) {
        $iterations++;
        $logger->info("Check iteration: $iterations");
        
        $currentTime = time();
        
        // Refresh monitor configurations every 10 seconds to pick up any changes
        if ($currentTime - $lastConfigRefresh >= 10) {
            $logger->info("Refreshing monitor configurations to pick up any changes");
            $refreshedMonitors = $monitorService->findAll(1, 1000);
            
            // Check for updated monitors
            foreach ($refreshedMonitors as $refreshedMonitor) {
                $monitorId = $refreshedMonitor->getId();
                
                // If this is a new monitor, add it to our tracking
                if (!isset($monitorConfigs[$monitorId])) {
                    $monitorConfigs[$monitorId] = $refreshedMonitor;
                    $nextCheckTime[$monitorId] = $currentTime; // Schedule immediately
                    $logger->info("New monitor detected: {$refreshedMonitor->getLabel()} (ID: {$monitorId})");
                    continue;
                }
                
                // Check if periodicity changed
                $oldPeriodicity = $monitorConfigs[$monitorId]->getPeriodicity();
                $newPeriodicity = $refreshedMonitor->getPeriodicity();
                
                if ($oldPeriodicity != $newPeriodicity) {
                    $logger->info("Monitor {$refreshedMonitor->getLabel()} (ID: {$monitorId}) periodicity changed from {$oldPeriodicity}s to {$newPeriodicity}s");
                    
                    // Update next check time based on the new periodicity
                    // If periodicity decreased, we might need to check sooner
                    if ($newPeriodicity < $oldPeriodicity) {
                        $latestStatus = $statusService->getLatestStatus($monitorId);
                        if ($latestStatus) {
                            $lastCheckTime = $latestStatus->getStartTime()->getTimestamp();
                            $newNextCheckTime = $lastCheckTime + $newPeriodicity;
                            
                            // Only update if it would make the check sooner
                            if ($newNextCheckTime < $nextCheckTime[$monitorId]) {
                                $nextCheckTime[$monitorId] = $newNextCheckTime;
                                $logger->info("Next check time for monitor {$monitorId} adjusted to: " . date('Y-m-d H:i:s', $newNextCheckTime));
                            }
                        }
                    }
                }
                
                // Update the stored monitor configuration
                $monitorConfigs[$monitorId] = $refreshedMonitor;
            }
            
            // Check for deleted monitors
            $refreshedIds = array_map(function($m) { return $m->getId(); }, $refreshedMonitors);
            foreach (array_keys($monitorConfigs) as $existingId) {
                if (!in_array($existingId, $refreshedIds)) {
                    $logger->info("Monitor ID: {$existingId} has been deleted, removing from check schedule");
                    unset($monitorConfigs[$existingId]);
                    unset($nextCheckTime[$existingId]);
                }
            }
            
            $lastConfigRefresh = $currentTime;
        }
        
        $monitorsToCheck = [];
        
        // Identify monitors that are due for checking at the current time
        foreach ($monitorConfigs as $monitorId => $monitor) {
            if ($currentTime >= ($nextCheckTime[$monitorId] ?? $currentTime)) {
                $monitorsToCheck[] = $monitor;
            }
        }
        
        if (count($monitorsToCheck) > 0) {
            $logger->info('Found ' . count($monitorsToCheck) . ' monitors due for check');
            
            // Check each due monitor
            foreach ($monitorsToCheck as $monitor) {
                $monitorId = $monitor->getId();
                $periodicity = $monitor->getPeriodicity();
                
                $logger->info("Checking monitor: {$monitor->getLabel()} (ID: {$monitorId}) with periodicity: {$periodicity}s");
                $logger->info("Scheduled time: " . date('Y-m-d H:i:s', $nextCheckTime[$monitorId]) . ", Current time: " . date('Y-m-d H:i:s', $currentTime));
                
                $status = $monitoringService->checkMonitor($monitorId);
                
                if ($status) {
                    $statusText = $status->getStatus() ? "UP" : "DOWN";
                    $logger->info("Monitor {$monitor->getLabel()} status: {$statusText}");
                    
                    // Important: Schedule next check time based on the PREVIOUS scheduled time, not the current time
                    // This prevents drift in check intervals
                    $nextCheckTime[$monitorId] = $nextCheckTime[$monitorId] + $periodicity;
                    
                    // However, if we've fallen too far behind (more than one interval), catch up to avoid backlog
                    if ($nextCheckTime[$monitorId] < $currentTime) {
                        $nextCheckTime[$monitorId] = $currentTime + $periodicity;
                        $logger->info("Adjusted schedule for monitor {$monitor->getLabel()} to prevent backlog");
                    }
                    
                    $logger->info("Next check scheduled at: " . date('Y-m-d H:i:s', $nextCheckTime[$monitorId]));
                } else {
                    $logger->error("Failed to check monitor {$monitor->getLabel()}");
                    // Still schedule the next check even if this one failed
                    $nextCheckTime[$monitorId] = $currentTime + $periodicity;
                }
            }
        } else {
            $logger->info('No monitors due for check at this iteration');
        }
        
        // Find the next monitor check time to optimize sleep duration
        $nextDueTime = PHP_INT_MAX;
        foreach ($nextCheckTime as $time) {
            if ($time < $nextDueTime) {
                $nextDueTime = $time;
            }
        }
        
        // Calculate sleep time until the next check is due (or default to 1 second)
        $sleepTime = max(1, min(5, $nextDueTime - time()));
        
        if (time() < $endTime) {
            $logger->info("Sleeping for {$sleepTime} seconds until next check is due");
            sleep($sleepTime);
        }
    }
    
    $logger->info("Monitor check loop completed after $iterations iterations");
} catch (Exception $e) {
    $logger->error('Error running monitor checks: ' . $e->getMessage());
    exit(1);
} 