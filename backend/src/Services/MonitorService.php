<?php

namespace Martinlejko\Backend\Services;

use Doctrine\DBAL\Connection;
use Martinlejko\Backend\Models\Monitor;
use Psr\Log\LoggerInterface;

class MonitorService
{
    private Connection $db;
    private LoggerInterface $logger;

    public function __construct(Connection $db, LoggerInterface $logger)
    {
        $this->db     = $db;
        $this->logger = $logger;
    }

    public function findAll(int $page = 1, int $limit = 10, ?int $projectId = null, ?string $labelFilter = null, ?string $typeFilter = null, ?bool $statusFilter = null): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $queryBuilder = $this->db->createQueryBuilder()
                ->select('m.*')
                ->from('monitors', 'm')
                ->setMaxResults($limit)
                ->setFirstResult($offset);

            if ($projectId !== null) {
                $queryBuilder->andWhere('m.project_id = :projectId')
                    ->setParameter('projectId', $projectId);
            }

            if ($labelFilter) {
                $queryBuilder->andWhere('m.label LIKE :label')
                    ->setParameter('label', '%' . $labelFilter . '%');
            }

            if ($typeFilter) {
                $queryBuilder->andWhere('m.type = :type')
                    ->setParameter('type', $typeFilter);
            }

            if ($statusFilter !== null) {
                $queryBuilder->leftJoin(
                    'm',
                    '(SELECT monitor_id, MAX(start_time) as latest_time 
                      FROM monitor_status 
                      GROUP BY monitor_id)',
                    'latest',
                    'm.id = latest.monitor_id'
                )
                ->leftJoin(
                    'latest',
                    'monitor_status',
                    'ms',
                    'latest.monitor_id = ms.monitor_id AND latest.latest_time = ms.start_time'
                )
                ->andWhere('ms.status = :status')
                ->setParameter('status', $statusFilter ? 1 : 0);
            }

            $results = $queryBuilder->executeQuery()->fetchAllAssociative();

            $monitors = [];
            foreach ($results as $row) {
                $data = [
                    'id'          => $row['id'],
                    'projectId'   => $row['project_id'],
                    'label'       => $row['label'],
                    'periodicity' => $row['periodicity'],
                    'type'        => $row['type'],
                    'badgeLabel'  => $row['badge_label']
                ];

                if ($row['type'] === 'ping') {
                    $data['host'] = $row['host'];
                    $data['port'] = $row['port'];
                } elseif ($row['type'] === 'website') {
                    $data['url']         = $row['url'];
                    $data['checkStatus'] = (bool)$row['check_status'];
                    $data['keywords']    = json_decode($row['keywords'] ?? '[]', true);
                }

                $monitors[] = Monitor::fromArray($data);
            }

            return $monitors;
        } catch (\Exception $e) {
            $this->logger->error('Error fetching monitors: ' . $e->getMessage());
            throw $e;
        }
    }

    public function find(int $id): ?Monitor
    {
        try {
            $result = $this->db->createQueryBuilder()
                ->select('*')
                ->from('monitors')
                ->where('id = :id')
                ->setParameter('id', $id)
                ->executeQuery()
                ->fetchAssociative();

            if (!$result) {
                return null;
            }

            $data = [
                'id'          => $result['id'],
                'projectId'   => $result['project_id'],
                'label'       => $result['label'],
                'periodicity' => $result['periodicity'],
                'type'        => $result['type'],
                'badgeLabel'  => $result['badge_label']
            ];

            if ($result['type'] === 'ping') {
                $data['host'] = $result['host'];
                $data['port'] = $result['port'];
            } elseif ($result['type'] === 'website') {
                $data['url']         = $result['url'];
                $data['checkStatus'] = (bool)$result['check_status'];
                $data['keywords']    = json_decode($result['keywords'] ?? '[]', true);
            }

            return Monitor::fromArray($data);
        } catch (\Exception $e) {
            $this->logger->error('Error fetching monitor: ' . $e->getMessage());
            throw $e;
        }
    }

    public function create(Monitor $monitor): Monitor
    {
        try {
            $data = [
                'project_id'  => $monitor->getProjectId(),
                'label'       => $monitor->getLabel(),
                'periodicity' => $monitor->getPeriodicity(),
                'type'        => $monitor->getType(),
                'badge_label' => $monitor->getBadgeLabel()
            ];

            if ($monitor->getType() === 'ping') {
                $data['host']         = $monitor->getHost();
                $data['port']         = $monitor->getPort();
                $data['url']          = null;
                $data['check_status'] = 0;
                $data['keywords']     = json_encode([]);
            } elseif ($monitor->getType() === 'website') {
                $data['url']          = $monitor->getUrl();
                $data['check_status'] = $monitor->isCheckStatus() ? 1 : 0;
                $data['keywords']     = json_encode($monitor->getKeywords());
                $data['host']         = null;
                $data['port']         = null;
            }

            $this->db->insert('monitors', $data);

            $id = $this->db->lastInsertId();
            $monitor->setId($id);

            $this->logger->info('Created monitor with ID: ' . $id);

            return $monitor;
        } catch (\Exception $e) {
            $this->logger->error('Error creating monitor: ' . $e->getMessage());
            throw $e;
        }
    }

    public function update(Monitor $monitor): bool
    {
        try {
            $baseData = [
                'project_id'  => $monitor->getProjectId(),
                'label'       => $monitor->getLabel(),
                'periodicity' => $monitor->getPeriodicity(),
                'type'        => $monitor->getType(),
                'badge_label' => $monitor->getBadgeLabel()
            ];

            $typeSpecificData = [];
            if ($monitor->getType() === 'ping') {
                $typeSpecificData = [
                    'host'         => $monitor->getHost(),
                    'port'         => $monitor->getPort(),
                    'url'          => null,
                    'check_status' => 0,
                    'keywords'     => json_encode([])
                ];
            } elseif ($monitor->getType() === 'website') {
                $typeSpecificData = [
                    'url'          => $monitor->getUrl(),
                    'check_status' => $monitor->isCheckStatus() ? 1 : 0,
                    'keywords'     => json_encode($monitor->getKeywords()),
                    'host'         => null,
                    'port'         => null
                ];
            }

            $data = array_merge($baseData, $typeSpecificData);

            $affected = $this->db->update(
                'monitors',
                $data,
                ['id' => $monitor->getId()]
            );

            $this->logger->info('Updated monitor with ID: ' . $monitor->getId() . ' with data: ' . json_encode($data));

            return $affected > 0;
        } catch (\Exception $e) {
            $this->logger->error('Error updating monitor: ' . $e->getMessage() . ' - Data: ' . json_encode($data ?? []));
            throw $e;
        }
    }

    public function delete(int $id): bool
    {
        try {
            $affected = $this->db->delete('monitors', ['id' => $id]);

            $this->logger->info('Deleted monitor with ID: ' . $id);

            return $affected > 0;
        } catch (\Exception $e) {
            $this->logger->error('Error deleting monitor: ' . $e->getMessage());
            throw $e;
        }
    }

    public function count(?int $projectId = null, ?string $labelFilter = null, ?string $typeFilter = null, ?bool $statusFilter = null): int
    {
        try {
            $queryBuilder = $this->db->createQueryBuilder()
                ->select('COUNT(*)')
                ->from('monitors', 'm');

            if ($projectId !== null) {
                $queryBuilder->andWhere('m.project_id = :projectId')
                    ->setParameter('projectId', $projectId);
            }

            if ($labelFilter) {
                $queryBuilder->andWhere('m.label LIKE :label')
                    ->setParameter('label', '%' . $labelFilter . '%');
            }

            if ($typeFilter) {
                $queryBuilder->andWhere('m.type = :type')
                    ->setParameter('type', $typeFilter);
            }

            if ($statusFilter !== null) {
                $queryBuilder->leftJoin(
                    'm',
                    '(SELECT monitor_id, MAX(start_time) as latest_time 
                      FROM monitor_status 
                      GROUP BY monitor_id)',
                    'latest',
                    'm.id = latest.monitor_id'
                )
                ->leftJoin(
                    'latest',
                    'monitor_status',
                    'ms',
                    'latest.monitor_id = ms.monitor_id AND latest.latest_time = ms.start_time'
                )
                ->andWhere('ms.status = :status')
                ->setParameter('status', $statusFilter ? 1 : 0);
            }

            return (int) $queryBuilder->executeQuery()->fetchOne();
        } catch (\Exception $e) {
            $this->logger->error('Error counting monitors: ' . $e->getMessage());
            throw $e;
        }
    }
}
