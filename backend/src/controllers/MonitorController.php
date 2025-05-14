<?php

namespace Martinlejko\Backend\Controllers;

use Martinlejko\Backend\Models\Monitor;
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
        $this->statusService = $statusService;
        $this->projectService = $projectService;
        $this->logger = $logger;
    }
    
    public function getAllMonitors(Request $request, Response $response): Response
    {
        $queryParams = $request->getQueryParams();
        $page = isset($queryParams['page']) ? (int)$queryParams['page'] : 1;
        $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 10;
        $projectId = isset($queryParams['projectId']) ? (int)$queryParams['projectId'] : null;
        $labelFilter = $queryParams['label'] ?? null;
        $typeFilter = $queryParams['type'] ?? null;
        
        // Handle status filter
        $statusFilter = null;
        if (isset($queryParams['status'])) {
            $statusFilter = filter_var($queryParams['status'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }
        
        try {
            $monitors = $this->monitorService->findAll($page, $limit, $projectId, $labelFilter, $typeFilter, $statusFilter);
            $total = $this->monitorService->count($projectId, $labelFilter, $typeFilter, $statusFilter);
            $lastPage = ceil($total / $limit);
            
            // Get latest status for each monitor
            $monitorsWithStatus = array_map(function(Monitor $monitor) {
                $data = $monitor->toArray();
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
                    'lastPage' => $lastPage,
                    'perPage' => $limit,
                    'total' => $total
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
        $id = (int)$args['id'];
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
            // Check if monitor exists
            $monitor = $this->monitorService->find($id);
            
            if (!$monitor) {
                $response->getBody()->write(json_encode(['error' => 'Monitor not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Delete monitor
            $success = $this->monitorService->delete($id);
            
            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'Failed to delete monitor']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
            
            return $response->withStatus(204);
        } catch (\Exception $e) {
            $this->logger->error('Error deleting monitor: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to delete monitor']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    public function getMonitorStatus(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $queryParams = $request->getQueryParams();
        $page = isset($queryParams['page']) ? (int)$queryParams['page'] : 1;
        $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 10;
        $view = $queryParams['view'] ?? 'list';
        
        // Handle date filters
        $fromDate = null;
        if (isset($queryParams['from'])) {
            try {
                $fromDate = new \DateTime($queryParams['from']);
            } catch (\Exception $e) {
                $response->getBody()->write(json_encode(['error' => 'Invalid from date format']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        $toDate = null;
        if (isset($queryParams['to'])) {
            try {
                $toDate = new \DateTime($queryParams['to']);
            } catch (\Exception $e) {
                $response->getBody()->write(json_encode(['error' => 'Invalid to date format']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        
        // Handle status filter
        $statusFilter = null;
        if (isset($queryParams['status'])) {
            $statusFilter = filter_var($queryParams['status'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }
        
        try {
            // Check if monitor exists
            $monitor = $this->monitorService->find($id);
            
            if (!$monitor) {
                $response->getBody()->write(json_encode(['error' => 'Monitor not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Return data based on view type
            switch ($view) {
                case 'calendar':
                    // Default to last 3 months if date range not specified
                    if (!$fromDate) {
                        $fromDate = new \DateTime();
                        $fromDate->modify('-3 months');
                    }
                    
                    if (!$toDate) {
                        $toDate = new \DateTime();
                    }
                    
                    $calendarData = $this->statusService->getDailyStatusSummary($id, $fromDate, $toDate);
                    $response->getBody()->write(json_encode(['data' => $calendarData]));
                    break;
                    
                case 'graph':
                    $graphData = $this->statusService->getResponseTimeData($id, $fromDate, $toDate);
                    $response->getBody()->write(json_encode(['data' => $graphData]));
                    break;
                    
                case 'list':
                default:
                    $statuses = $this->statusService->findByMonitor($id, $page, $limit, $fromDate, $toDate, $statusFilter);
                    $total = $this->statusService->countByMonitor($id, $fromDate, $toDate, $statusFilter);
                    $lastPage = ceil($total / $limit);
                    
                    $result = [
                        'data' => array_map(fn($s) => $s->toArray(), $statuses),
                        'meta' => [
                            'currentPage' => $page,
                            'lastPage' => $lastPage,
                            'perPage' => $limit,
                            'total' => $total
                        ]
                    ];
                    
                    $response->getBody()->write(json_encode($result));
                    break;
            }
            
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error getting monitor status: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to fetch monitor status']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
} 