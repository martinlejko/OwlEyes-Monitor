<?php

namespace Martinlejko\Backend\Services;

use Doctrine\DBAL\Connection;
use Martinlejko\Backend\Models\MonitorStatus;
use Psr\Log\LoggerInterface;

class MonitorStatusService
{
    private Connection $db;
    private LoggerInterface $logger;
    
    public function __construct(Connection $db, LoggerInterface $logger)
    {
        $this->db = $db;
        $this->logger = $logger;
    }
    
    public function findByMonitor(int $monitorId, int $page = 1, int $limit = 10, ?\DateTime $fromDate = null, ?\DateTime $toDate = null, ?bool $statusFilter = null): array
    {
        try {
            $offset = ($page - 1) * $limit;
            
            $queryBuilder = $this->db->createQueryBuilder()
                ->select('*')
                ->from('monitor_status')
                ->where('monitor_id = :monitorId')
                ->setParameter('monitorId', $monitorId)
                ->orderBy('start_time', 'DESC')
                ->setMaxResults($limit)
                ->setFirstResult($offset);
            
            // Apply date filters
            if ($fromDate) {
                $queryBuilder->andWhere('start_time >= :fromDate')
                    ->setParameter('fromDate', $fromDate->format('Y-m-d H:i:s'));
            }
            
            if ($toDate) {
                $queryBuilder->andWhere('start_time <= :toDate')
                    ->setParameter('toDate', $toDate->format('Y-m-d H:i:s'));
            }
            
            // Apply status filter
            if ($statusFilter !== null) {
                $queryBuilder->andWhere('status = :status')
                    ->setParameter('status', $statusFilter ? 1 : 0);
            }
            
            $results = $queryBuilder->executeQuery()->fetchAllAssociative();
            
            $statuses = [];
            foreach ($results as $row) {
                $data = [
                    'id' => $row['id'],
                    'monitorId' => $row['monitor_id'],
                    'startTime' => new \DateTime($row['start_time']),
                    'status' => (bool)$row['status'],
                    'responseTime' => $row['response_time']
                ];
                $statuses[] = MonitorStatus::fromArray($data);
            }
            
            return $statuses;
        } catch (\Exception $e) {
            $this->logger->error('Error fetching monitor statuses: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function getLatestStatus(int $monitorId): ?MonitorStatus
    {
        try {
            $result = $this->db->createQueryBuilder()
                ->select('*')
                ->from('monitor_status')
                ->where('monitor_id = :monitorId')
                ->setParameter('monitorId', $monitorId)
                ->orderBy('start_time', 'DESC')
                ->setMaxResults(1)
                ->executeQuery()
                ->fetchAssociative();
            
            if (!$result) {
                return null;
            }
            
            $data = [
                'id' => $result['id'],
                'monitorId' => $result['monitor_id'],
                'startTime' => new \DateTime($result['start_time']),
                'status' => (bool)$result['status'],
                'responseTime' => $result['response_time']
            ];
            
            return MonitorStatus::fromArray($data);
        } catch (\Exception $e) {
            $this->logger->error('Error fetching latest monitor status: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function create(MonitorStatus $status): MonitorStatus
    {
        try {
            $this->db->insert('monitor_status', [
                'monitor_id' => $status->getMonitorId(),
                'start_time' => $status->getStartTime()->format('Y-m-d H:i:s'),
                'status' => $status->getStatus() ? 1 : 0,
                'response_time' => $status->getResponseTime()
            ]);
            
            $id = $this->db->lastInsertId();
            $status->setId($id);
            
            $this->logger->info('Created monitor status with ID: ' . $id);
            return $status;
        } catch (\Exception $e) {
            $this->logger->error('Error creating monitor status: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function getDailyStatusSummary(int $monitorId, \DateTime $startDate, \DateTime $endDate): array
    {
        try {
            // Get total count of checks per day
            $totalChecksQuery = $this->db->createQueryBuilder()
                ->select('DATE(start_time) as date, COUNT(*) as total')
                ->from('monitor_status')
                ->where('monitor_id = :monitorId')
                ->andWhere('start_time BETWEEN :startDate AND :endDate')
                ->setParameter('monitorId', $monitorId)
                ->setParameter('startDate', $startDate->format('Y-m-d'))
                ->setParameter('endDate', $endDate->format('Y-m-d 23:59:59'))
                ->groupBy('DATE(start_time)')
                ->executeQuery()
                ->fetchAllAssociative();
            
            // Get failed count per day
            $failedChecksQuery = $this->db->createQueryBuilder()
                ->select('DATE(start_time) as date, COUNT(*) as failed')
                ->from('monitor_status')
                ->where('monitor_id = :monitorId')
                ->andWhere('status = 0')
                ->andWhere('start_time BETWEEN :startDate AND :endDate')
                ->setParameter('monitorId', $monitorId)
                ->setParameter('startDate', $startDate->format('Y-m-d'))
                ->setParameter('endDate', $endDate->format('Y-m-d 23:59:59'))
                ->groupBy('DATE(start_time)')
                ->executeQuery()
                ->fetchAllAssociative();
            
            // Convert to associative array
            $totalChecks = [];
            foreach ($totalChecksQuery as $row) {
                $totalChecks[$row['date']] = (int)$row['total'];
            }
            
            $failedChecks = [];
            foreach ($failedChecksQuery as $row) {
                $failedChecks[$row['date']] = (int)$row['failed'];
            }
            
            // Create result array
            $result = [];
            $current = clone $startDate;
            while ($current <= $endDate) {
                $dateString = $current->format('Y-m-d');
                $total = $totalChecks[$dateString] ?? 0;
                $failed = $failedChecks[$dateString] ?? 0;
                
                $status = 'success'; // default
                if ($total > 0) {
                    $failurePercent = ($failed / $total) * 100;
                    if ($failurePercent > 5) {
                        $status = 'danger';
                    } else if ($failurePercent > 0) {
                        $status = 'warning';
                    }
                }
                
                $result[] = [
                    'date' => $dateString,
                    'total' => $total,
                    'failed' => $failed,
                    'status' => $status
                ];
                
                $current->modify('+1 day');
            }
            
            return $result;
        } catch (\Exception $e) {
            $this->logger->error('Error fetching monitor daily status summary: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function getResponseTimeData(int $monitorId, ?\DateTime $fromDate = null, ?\DateTime $toDate = null, int $limit = 100): array
    {
        try {
            $queryBuilder = $this->db->createQueryBuilder()
                ->select('start_time, response_time')
                ->from('monitor_status')
                ->where('monitor_id = :monitorId')
                ->setParameter('monitorId', $monitorId)
                ->orderBy('start_time', 'DESC')
                ->setMaxResults($limit);
            
            // Apply date filters
            if ($fromDate) {
                $queryBuilder->andWhere('start_time >= :fromDate')
                    ->setParameter('fromDate', $fromDate->format('Y-m-d H:i:s'));
            }
            
            if ($toDate) {
                $queryBuilder->andWhere('start_time <= :toDate')
                    ->setParameter('toDate', $toDate->format('Y-m-d H:i:s'));
            }
            
            $results = $queryBuilder->executeQuery()->fetchAllAssociative();
            
            // Reverse the array to get chronological order
            return array_map(function($row) {
                return [
                    'time' => $row['start_time'],
                    'responseTime' => (int)$row['response_time']
                ];
            }, array_reverse($results));
        } catch (\Exception $e) {
            $this->logger->error('Error fetching monitor response time data: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function countByMonitor(int $monitorId, ?\DateTime $fromDate = null, ?\DateTime $toDate = null, ?bool $statusFilter = null): int
    {
        try {
            $queryBuilder = $this->db->createQueryBuilder()
                ->select('COUNT(*)')
                ->from('monitor_status')
                ->where('monitor_id = :monitorId')
                ->setParameter('monitorId', $monitorId);
            
            // Apply date filters
            if ($fromDate) {
                $queryBuilder->andWhere('start_time >= :fromDate')
                    ->setParameter('fromDate', $fromDate->format('Y-m-d H:i:s'));
            }
            
            if ($toDate) {
                $queryBuilder->andWhere('start_time <= :toDate')
                    ->setParameter('toDate', $toDate->format('Y-m-d H:i:s'));
            }
            
            // Apply status filter
            if ($statusFilter !== null) {
                $queryBuilder->andWhere('status = :status')
                    ->setParameter('status', $statusFilter ? 1 : 0);
            }
            
            return (int) $queryBuilder->executeQuery()->fetchOne();
        } catch (\Exception $e) {
            $this->logger->error('Error counting monitor statuses: ' . $e->getMessage());
            throw $e;
        }
    }
} 