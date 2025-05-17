<?php

namespace Martinlejko\Backend\Services;

use Martinlejko\Backend\Models\Monitor;
use Martinlejko\Backend\Models\MonitorStatus;
use Psr\Log\LoggerInterface;

class MonitoringService
{
    private MonitorService $monitorService;
    private MonitorStatusService $statusService;
    private LoggerInterface $logger;

    public function __construct(
        MonitorService $monitorService,
        MonitorStatusService $statusService,
        LoggerInterface $logger
    ) {
        $this->monitorService = $monitorService;
        $this->statusService  = $statusService;
        $this->logger         = $logger;
    }

    public function checkMonitor(int $monitorId): ?MonitorStatus
    {
        try {
            $monitor = $this->monitorService->find($monitorId);

            if (!$monitor) {
                $this->logger->error("Monitor not found: {$monitorId}");
                return null;
            }

            $this->logger->info("Checking monitor: {$monitor->getLabel()} (ID: {$monitorId})");

            $startTime      = new \DateTime();
            $startTimestamp = microtime(true);
            $status         = false;

            if ($monitor->getType() === 'ping') {
                $status = $this->performPingCheck($monitor);
            } elseif ($monitor->getType() === 'website') {
                $status = $this->performWebsiteCheck($monitor);
            } else {
                throw new \InvalidArgumentException("Unknown monitor type: {$monitor->getType()}");
            }

            $endTimestamp = microtime(true);
            $responseTime = (int)(($endTimestamp - $startTimestamp) * 1000); // Convert to milliseconds

            $monitorStatus = new MonitorStatus(
                $monitorId,
                $startTime,
                $status,
                $responseTime
            );

            $this->statusService->create($monitorStatus);

            $statusText = $status ? 'UP' : 'DOWN';
            $this->logger->info("Monitor check completed: {$monitor->getLabel()} is {$statusText} (Response time: {$responseTime}ms)");

            return $monitorStatus;
        } catch (\Exception $e) {
            $this->logger->error("Error checking monitor {$monitorId}: " . $e->getMessage());
            return null;
        }
    }

    private function performPingCheck(Monitor $monitor): bool
    {
        $host = $monitor->getHost();
        $port = $monitor->getPort();

        if (empty($host) || empty($port)) {
            $this->logger->error("Ping monitor missing host or port: {$monitor->getId()}");
            return false;
        }

        $socket = @fsockopen($host, $port, $errno, $errstr, 5);

        if (!$socket) {
            $this->logger->info("Ping check failed for {$host}:{$port}: {$errstr} (Error {$errno})");
            return false;
        }

        fclose($socket);
        return true;
    }

    private function performWebsiteCheck(Monitor $monitor): bool
    {
        $url         = $monitor->getUrl();
        $checkStatus = $monitor->isCheckStatus();
        $keywords    = $monitor->getKeywords();

        if (empty($url)) {
            $this->logger->error("Website monitor missing URL: {$monitor->getId()}");
            return false;
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 second timeout
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Skip certificate verification

        $content  = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($content === false) {
            $this->logger->info("Website check failed for {$url}: Connection failed");
            return false;
        }

        if ($checkStatus && ($httpCode < 200 || $httpCode >= 300)) {
            $this->logger->info("Website check failed for {$url}: Status code {$httpCode}");
            return false;
        }

        if (!empty($keywords)) {
            foreach ($keywords as $keyword) {
                if (strpos($content, $keyword) === false) {
                    $this->logger->info("Website check failed for {$url}: Keyword '{$keyword}' not found");
                    return false;
                }
            }
        }

        return true;
    }

    public function getMonitorsDueForCheck(): array
    {
        try {
            $monitors    = $this->monitorService->findAll(1, 1000);
            $dueMonitors = [];

            foreach ($monitors as $monitor) {
                $latestStatus = $this->statusService->getLatestStatus($monitor->getId());

                if (
                    !$latestStatus || (time() - $latestStatus->getStartTime()->getTimestamp() >= $monitor->getPeriodicity())
                ) {
                    $dueMonitors[] = $monitor;
                }
            }

            return $dueMonitors;
        } catch (\Exception $e) {
            $this->logger->error('Error getting monitors due for check: ' . $e->getMessage());
            return [];
        }
    }
}
