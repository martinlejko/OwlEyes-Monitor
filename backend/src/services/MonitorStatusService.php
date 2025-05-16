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
            // Get raw status data 
            $queryBuilder = $this->db->createQueryBuilder()
                ->select('*')
                ->from('monitor_status')
                ->where('monitor_id = :monitorId')
                ->setParameter('monitorId', $monitorId)
                ->orderBy('start_time', 'DESC')
                ->setMaxResults(1000); // Get up to 1000 recent records
            
            $results = $queryBuilder->executeQuery()->fetchAllAssociative();
            
            // Group by day
            $dayData = [];
            foreach ($results as $row) {
                // Extract date part only
                $dateTime = new \DateTime($row['start_time']);
                $dateStr = $dateTime->format('Y-m-d');
                
                if (!isset($dayData[$dateStr])) {
                    $dayData[$dateStr] = [
                        'total' => 0,
                        'failed' => 0
                    ];
                }
                
                $dayData[$dateStr]['total']++;
                
                // Count failed checks (status = 0 means failed)
                if ((int)$row['status'] === 0) {
                    $dayData[$dateStr]['failed']++;
                }
            }
            
            // Convert to CalendarDataPoint format
            $result = [];
            foreach ($dayData as $date => $counts) {
                $total = $counts['total'];
                $failed = $counts['failed'];
                
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
                    'date' => $date,
                    'total' => $total,
                    'failed' => $failed,
                    'status' => $status
                ];
            }
            
            return $result;
        } catch (\Exception $e) {
            $this->logger->error('Error in getDailyStatusSummary: ' . $e->getMessage());
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