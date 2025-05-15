<?php

namespace Martinlejko\Backend\Commands;

use Doctrine\DBAL\Connection;
use Martinlejko\Backend\Models\Monitor;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Martinlejko\Backend\Services\MonitoringService;
use Psr\Log\LoggerInterface;

/**
 * Command to set up website monitors and fix any networking issues with Docker
 */
class WebsiteMonitorSetupCommand
{
    private Connection $db;
    private MonitorService $monitorService;
    private MonitorStatusService $statusService;
    private MonitoringService $monitoringService;
    private LoggerInterface $logger;

    public function __construct(
        Connection $db,
        MonitorService $monitorService,
        MonitorStatusService $statusService,
        MonitoringService $monitoringService,
        LoggerInterface $logger
    ) {
        $this->db = $db;
        $this->monitorService = $monitorService;
        $this->statusService = $statusService;
        $this->monitoringService = $monitoringService;
        $this->logger = $logger;
    }

    /**
     * Run the command
     */
    public function execute(): int
    {
        $this->logger->info('Starting website monitor setup');

        try {
            // Step 1: Fix localhost URLs in Docker environment
            $this->fixLocalhostUrls();

            // Step 2: Add test monitors if they don't exist
            $this->addTestMonitor(
                'YouTube Check',
                'https://www.youtube.com',
                60, // 1 minute interval
                ['YouTube'],
                true
            );
            
            $this->addTestMonitor(
                'Google Check',
                'https://www.google.com',
                120, // 2 minute interval
                ['Google'],
                true
            );

            // Step 3: Test run all monitors to ensure they're working
            $this->testAllMonitors();

            // Step 4: Fix cron job to ensure monitoring runs properly
            $this->setupCronJob();

            $this->logger->info('Website monitor setup completed successfully');
            return 0;
        } catch (\Exception $e) {
            $this->logger->error('Error in website monitor setup: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * Fix URLs that reference localhost to use host.docker.internal for Docker networking
     */
    private function fixLocalhostUrls(): void
    {
        $result = $this->db->executeStatement("
            UPDATE monitors 
            SET url = REPLACE(url, 'http://localhost:', 'http://host.docker.internal:') 
            WHERE type = 'website' AND url LIKE 'http://localhost:%'
        ");
        
        $this->logger->info("Updated {$result} monitors with localhost URLs to use host.docker.internal");
    }

    /**
     * Add a test monitor if one with the same URL doesn't exist yet
     *
     * @param string $label The label for the monitor
     * @param string $url The URL to monitor
     * @param int $interval Check interval in seconds
     * @param array $keywords Keywords to check for in the response
     * @param bool $checkStatus Whether to check HTTP status
     */
    private function addTestMonitor(
        string $label,
        string $url,
        int $interval = 60,
        array $keywords = [],
        bool $checkStatus = true
    ): void {
        $existingMonitors = $this->db->fetchAllAssociative("
            SELECT id FROM monitors 
            WHERE type = 'website' AND url = :url",
            ['url' => $url]
        );
        
        if (empty($existingMonitors)) {
            $this->logger->info("Creating new test monitor for {$url}");
            
            // Get the first project ID to associate the monitor with
            $projectId = $this->db->fetchOne("SELECT id FROM projects LIMIT 1");
            
            if ($projectId) {
                // Create test monitor
                $testMonitor = new Monitor(
                    $projectId,
                    $label,
                    $interval,
                    'website',
                    strtolower(parse_url($url, PHP_URL_HOST) ?? 'test')
                );
                
                $testMonitor->setUrl($url)
                          ->setCheckStatus($checkStatus);
                
                if (!empty($keywords)) {
                    $testMonitor->setKeywords($keywords);
                }
                
                $this->monitorService->create($testMonitor);
                $this->logger->info("{$label} monitor created with ID: " . $testMonitor->getId());
            } else {
                $this->logger->warning("No projects found to associate test monitor with");
            }
        } else {
            $this->logger->info("Test monitor for {$url} already exists");
        }
    }

    /**
     * Run test checks on all monitors
     */
    private function testAllMonitors(): void
    {
        $monitors = $this->monitorService->findAll(1, 100);
        $this->logger->info('Found ' . count($monitors) . ' monitors to check');
        
        $websiteMonitorsFound = false;
        
        foreach ($monitors as $monitor) {
            if ($monitor->getType() === 'website') {
                $websiteMonitorsFound = true;
                
                $this->logger->info("Testing monitor: {$monitor->getLabel()} (ID: {$monitor->getId()})");
                $this->logger->info("URL: " . $monitor->getUrl());
                $this->logger->info("Periodicity: " . $monitor->getPeriodicity() . " seconds");
                
                // Perform a one-time check regardless of periodicity for initial validation
                $status = $this->monitoringService->checkMonitor($monitor->getId());
                
                if ($status) {
                    $statusText = $status->getStatus() ? "UP" : "DOWN";
                    $this->logger->info("Monitor {$monitor->getLabel()} status: {$statusText} (Response time: {$status->getResponseTime()}ms)");
                } else {
                    $this->logger->error("Failed to check monitor {$monitor->getLabel()}");
                }
            }
        }
        
        if (!$websiteMonitorsFound) {
            $this->logger->warning("No website monitors found in the system");
        }
    }

    /**
     * Set up cron job to run monitors regularly
     */
    private function setupCronJob(): void
    {
        try {
            // Run the monitor check script once per minute
            // The script runs in a loop for ~58 seconds, checking monitors according to their periodicity
            // This approach allows us to support monitors with sub-minute intervals (as low as 5 seconds)
            $cronContent = '* * * * * root cd /var/www && /usr/local/bin/php check_monitors.php >> /var/www/logs/cron.log 2>&1';
            
            $cronFile = '/etc/cron.d/owleyes-cron';
            
            // Direct method - no sudo needed in Docker container
            if (is_writable('/etc/cron.d') || is_writable($cronFile)) {
                file_put_contents($cronFile, $cronContent . PHP_EOL); // Make sure we add a newline
                chmod($cronFile, 0644);
                exec('service cron restart', $output, $returnCode);
                
                if ($returnCode === 0) {
                    $this->logger->info('Cron job updated successfully to run continuous monitor checks');
                    $this->logger->info('Monitors will be checked according to their individual periodicity (5-300 seconds)');
                } else {
                    $this->logger->warning('Cron job file created but could not restart cron service');
                }
            } else {
                $this->logger->warning('Could not update cron job file - permission denied');
                $this->logger->info('Here is the command to run with proper permissions:');
                $this->logger->info('echo "' . $cronContent . '" > /etc/cron.d/owleyes-cron && chmod 0644 /etc/cron.d/owleyes-cron && service cron restart');
            }
        } catch (\Exception $e) {
            $this->logger->warning('Error updating cron job: ' . $e->getMessage());
        }
    }
} 