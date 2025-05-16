<?php

namespace Martinlejko\Backend\Controllers;

use Martinlejko\Backend\Models\Monitor;
use Martinlejko\Backend\Models\MonitorStatus;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Martinlejko\Backend\Services\ProjectService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class MonitorController
{
    private MonitorService $monitorService;
    private MonitorStatusService $statusService;
    private ProjectService $projectService;
    private LoggerInterface $logger;

    public function __construct(
        MonitorService $monitorService,
        MonitorStatusService $statusService,
        ProjectService $projectService,
        LoggerInterface $logger
    ) {
        $this->monitorService = $monitorService;
        $this->statusService  = $statusService;
        $this->projectService = $projectService;
        $this->logger         = $logger;
    }

    public function getAllMonitors(Request $request, Response $response): Response
    {
        $queryParams = $request->getQueryParams();
        $page        = isset($queryParams['page']) ? (int)$queryParams['page'] : 1;
        $limit       = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 10;
        $projectId   = isset($queryParams['projectId']) ? (int)$queryParams['projectId'] : null;
        $labelFilter = $queryParams['label'] ?? null;
        $typeFilter  = $queryParams['type']  ?? null;

        // Handle status filter
        $statusFilter = null;
        if (isset($queryParams['status'])) {
            $statusFilter = filter_var($queryParams['status'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }

        try {
            $monitors = $this->monitorService->findAll($page, $limit, $projectId, $labelFilter, $typeFilter, $statusFilter);
            $total    = $this->monitorService->count($projectId, $labelFilter, $typeFilter, $statusFilter);
            $lastPage = ceil($total / $limit);

            // Get latest status for each monitor
            $monitorsWithStatus = array_map(function (Monitor $monitor) {
                $data         = $monitor->toArray();
                $latestStatus = $this->statusService->getLatestStatus($monitor->getId());

                if ($latestStatus) {
                    $data['latestStatus'] = $latestStatus->toArray();
                }

                return $data;
            }, $monitors);

            $result = [
                'data' => $monitorsWithStatus,
                'meta' => [
                    'currentPage' => $page,
                    'lastPage'    => $lastPage,
                    'perPage'     => $limit,
                    'total'       => $total
                ]
            ];

            $response->getBody()->write(json_encode($result));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error getting all monitors: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to fetch monitors']));

            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getMonitor(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];

        try {
            $monitor = $this->monitorService->find($id);

            if (!$monitor) {
                $response->getBody()->write(json_encode(['error' => 'Monitor not found']));

                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $data = $monitor->toArray();

            // Get latest status
            $latestStatus = $this->statusService->getLatestStatus($id);
            if ($latestStatus) {
                $data['latestStatus'] = $latestStatus->toArray();
            }

            $response->getBody()->write(json_encode($data));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error getting monitor: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to fetch monitor']));

            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function createMonitor(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        try {
            // Validate required fields
            if (empty($data['projectId']) || empty($data['label']) || empty($data['type']) || !isset($data['periodicity'])) {
                $response->getBody()->write(json_encode(['error' => 'Required fields missing: projectId, label, type, periodicity']));

                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Validate project exists
            $project = $this->projectService->find((int)$data['projectId']);
            if (!$project) {
                $response->getBody()->write(json_encode(['error' => 'Project not found']));

                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Create monitor
            $monitor = new Monitor(
                (int)$data['projectId'],
                $data['label'],
                (int)$data['periodicity'],
                $data['type'],
                $data['badgeLabel'] ?? $data['label']
            );

            // Set type-specific fields
            if ($data['type'] === 'ping') {
                if (empty($data['host']) || empty($data['port'])) {
                    $response->getBody()->write(json_encode(['error' => 'Ping monitor requires host and port']));

                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }

                $monitor->setHost($data['host'])
                    ->setPort((int)$data['port']);
            } elseif ($data['type'] === 'website') {
                if (empty($data['url'])) {
                    $response->getBody()->write(json_encode(['error' => 'Website monitor requires URL']));

                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }

                $monitor->setUrl($data['url'])
                    ->setCheckStatus($data['checkStatus'] ?? false)
                    ->setKeywords($data['keywords'] ?? []);
            } else {
                $response->getBody()->write(json_encode(['error' => 'Invalid monitor type']));

                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $monitor = $this->monitorService->create($monitor);

            $response->getBody()->write(json_encode($monitor->toArray()));

            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $this->logger->error('Validation error creating monitor: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));

            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error creating monitor: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to create monitor']));

            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateMonitor(Request $request, Response $response, array $args): Response
    {
        $id   = (int)$args['id'];
        $data = $request->getParsedBody();

        try {
            // Check if monitor exists
            $monitor = $this->monitorService->find($id);

            if (!$monitor) {
                $response->getBody()->write(json_encode(['error' => 'Monitor not found']));

                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Update basic properties
            if (isset($data['label'])) {
                $monitor->setLabel($data['label']);
            }

            if (isset($data['periodicity'])) {
                $monitor->setPeriodicity((int)$data['periodicity']);
            }

            if (isset($data['badgeLabel'])) {
                $monitor->setBadgeLabel($data['badgeLabel']);
            }

            // Update type-specific properties
            if ($monitor->getType() === 'ping') {
                if (isset($data['host'])) {
                    $monitor->setHost($data['host']);
                }

                if (isset($data['port'])) {
                    $monitor->setPort((int)$data['port']);
                }
            } elseif ($monitor->getType() === 'website') {
                if (isset($data['url'])) {
                    $monitor->setUrl($data['url']);
                }

                if (isset($data['checkStatus'])) {
                    $monitor->setCheckStatus((bool)$data['checkStatus']);
                }

                if (isset($data['keywords'])) {
                    $monitor->setKeywords($data['keywords']);
                }
            }

            // Save changes
            $success = $this->monitorService->update($monitor);

            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'No changes made to monitor']));

                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode($monitor->toArray()));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\InvalidArgumentException $e) {
            $this->logger->error('Validation error updating monitor: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));

            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error updating monitor: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to update monitor']));

            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function deleteMonitor(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];

        try {
            // Log the deletion attempt for debugging
            $this->logger->info('Attempting to delete monitor with ID: ' . $id);

            // Check if monitor exists
            $monitor = $this->monitorService->find($id);

            if (!$monitor) {
                $this->logger->warning('Monitor not found for deletion: ' . $id);
                $response->getBody()->write(json_encode(['error' => 'Monitor not found']));

                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Store project ID for logging
            $projectId = $monitor->getProjectId();

            // Delete monitor
            $success = $this->monitorService->delete($id);

            if (!$success) {
                $this->logger->error('Failed to delete monitor: ' . $id);
                $response->getBody()->write(json_encode(['error' => 'Failed to delete monitor']));

                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $this->logger->info('Successfully deleted monitor with ID: ' . $id . ' from project: ' . $projectId);

            // Return 204 No Content on successful deletion
            return $response->withStatus(204);
        } catch (\Exception $e) {
            $this->logger->error('Error deleting monitor: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to delete monitor: ' . $e->getMessage()]));

            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Get status history for a specific monitor
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getMonitorStatus(Request $request, Response $response, array $args): Response
    {
        $id          = (int)$args['id'];
        $queryParams = $request->getQueryParams();
        $page        = (int)($queryParams['page'] ?? 1);
        $limit       = (int)($queryParams['limit'] ?? 10);
        $view        = $queryParams['view'] ?? 'list';

        // Parse date filters
        $fromDate = null;
        if (!empty($queryParams['from'])) {
            try {
                $fromDate = new \DateTime($queryParams['from']);
            } catch (\Exception $e) {
                $this->logger->warning('Invalid from date: ' . $queryParams['from']);
            }
        }

        $toDate = null;
        if (!empty($queryParams['to'])) {
            try {
                $toDate = new \DateTime($queryParams['to']);
            } catch (\Exception $e) {
                $this->logger->warning('Invalid to date: ' . $queryParams['to']);
            }
        }

        // Parse status filter
        $statusFilter = null;
        if (isset($queryParams['status'])) {
            $statusFilter = filter_var($queryParams['status'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }

        try {
            // Validate monitor exists
            $monitor = $this->monitorService->find($id);
            if (!$monitor) {
                $response->getBody()->write(json_encode(['error' => 'Monitor not found']));

                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Handle different view modes
            switch ($view) {
                case 'calendar':
                    // Use 3 months ago as default start date if not specified
                    if (!$fromDate) {
                        $fromDate = new \DateTime();
                        $fromDate->modify('-3 months');
                        $fromDate->setTime(0, 0, 0);
                    }

                    if (!$toDate) {
                        $toDate = new \DateTime();
                        $toDate->setTime(23, 59, 59);
                    }

                    $data = $this->statusService->getDailyStatusSummary($id, $fromDate, $toDate);

                    $result = [
                        'data' => $data
                    ];
                    break;

                case 'graph':
                    $data = $this->statusService->getResponseTimeData($id, $fromDate, $toDate, $limit);

                    $result = [
                        'data' => $data
                    ];
                    break;

                case 'list':
                default:
                    $statuses   = $this->statusService->findByMonitor($id, $page, $limit, $fromDate, $toDate, $statusFilter);
                    $totalItems = $this->statusService->countByMonitor($id, $fromDate, $toDate, $statusFilter);
                    $totalPages = ceil($totalItems / $limit);

                    $result = [
                        'data' => array_map(function (MonitorStatus $status) {
                            return $status->toArray();
                        }, $statuses),
                        'meta' => [
                            'currentPage' => $page,
                            'lastPage'    => $totalPages,
                            'perPage'     => $limit,
                            'total'       => $totalItems
                        ]
                    ];
                    break;
            }

            $response->getBody()->write(json_encode($result));

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error getting monitor status: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to fetch monitor status']));

            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
