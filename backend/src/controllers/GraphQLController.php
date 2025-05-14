<?php

namespace Martinlejko\Backend\Controllers;

use GraphQL\Error\DebugFlag;
use GraphQL\GraphQL;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Schema;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Martinlejko\Backend\Services\ProjectService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class GraphQLController
{
    private ProjectService $projectService;
    private MonitorService $monitorService;
    private MonitorStatusService $statusService;
    private LoggerInterface $logger;
    private bool $debug;
    
    public function __construct(
        ProjectService $projectService,
        MonitorService $monitorService,
        MonitorStatusService $statusService,
        LoggerInterface $logger
    ) {
        $this->projectService = $projectService;
        $this->monitorService = $monitorService;
        $this->statusService = $statusService;
        $this->logger = $logger;
        $this->debug = $_ENV['APP_DEBUG'] ?? false;
    }
    
    public function handleRequest(Request $request, Response $response): Response
    {
        try {
            $data = $request->getParsedBody();
            $query = $data['query'] ?? null;
            $variables = $data['variables'] ?? null;
            
            if (!$query) {
                throw new \InvalidArgumentException('Missing GraphQL query');
            }
            
            // Define schema
            $schema = $this->getSchema();
            
            // Execute query
            $result = GraphQL::executeQuery(
                $schema,
                $query,
                null,
                null,
                $variables
            );
            
            // Format result
            $output = $result->toArray(
                $this->debug ? DebugFlag::INCLUDE_DEBUG_MESSAGE | DebugFlag::INCLUDE_TRACE : DebugFlag::NONE
            );
            
            $response->getBody()->write(json_encode($output));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('GraphQL error: ' . $e->getMessage());
            $response->getBody()->write(json_encode([
                'errors' => [
                    [
                        'message' => $e->getMessage(),
                        'trace' => $this->debug ? $e->getTraceAsString() : null
                    ]
                ]
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }
    
    private function getSchema(): Schema
    {
        // Status type
        $statusType = new ObjectType([
            'name' => 'Status',
            'fields' => [
                'date' => [
                    'type' => Type::string(),
                    'resolve' => function ($status) {
                        return $status->getStartTime()->format(\DateTime::ATOM);
                    }
                ],
                'ok' => [
                    'type' => Type::boolean(),
                    'resolve' => function ($status) {
                        return $status->getStatus();
                    }
                ],
                'responseTime' => [
                    'type' => Type::int(),
                    'resolve' => function ($status) {
                        return $status->getResponseTime();
                    }
                ]
            ]
        ]);
        
        // Monitor type
        $monitorType = new ObjectType([
            'name' => 'Monitor',
            'fields' => [
                'identifier' => [
                    'type' => Type::id(),
                    'resolve' => function ($monitor) {
                        return (string) $monitor->getId();
                    }
                ],
                'periodicity' => [
                    'type' => Type::int(),
                    'resolve' => function ($monitor) {
                        return $monitor->getPeriodicity();
                    }
                ],
                'label' => [
                    'type' => Type::id(),
                    'resolve' => function ($monitor) {
                        return $monitor->getLabel();
                    }
                ],
                'type' => [
                    'type' => Type::string(),
                    'resolve' => function ($monitor) {
                        return $monitor->getType();
                    }
                ],
                'host' => [
                    'type' => Type::string(),
                    'resolve' => function ($monitor) {
                        return $monitor->getHost();
                    }
                ],
                'url' => [
                    'type' => Type::string(),
                    'resolve' => function ($monitor) {
                        return $monitor->getUrl();
                    }
                ],
                'badgeUrl' => [
                    'type' => Type::string(),
                    'resolve' => function ($monitor) {
                        return $_ENV['APP_URL'] . '/badge/' . $monitor->getId();
                    }
                ]
            ]
        ]);
        
        // Project type
        $projectType = new ObjectType([
            'name' => 'Project',
            'fields' => [
                'identifier' => [
                    'type' => Type::id(),
                    'resolve' => function ($project) {
                        return (string) $project->getId();
                    }
                ],
                'label' => [
                    'type' => Type::id(),
                    'resolve' => function ($project) {
                        return $project->getLabel();
                    }
                ],
                'description' => [
                    'type' => Type::id(),
                    'resolve' => function ($project) {
                        return $project->getDescription();
                    }
                ],
                'monitors' => [
                    'type' => Type::listOf($monitorType),
                    'resolve' => function ($project) {
                        return $this->monitorService->findAll(1, 100, $project->getId());
                    }
                ]
            ]
        ]);
        
        // Query type
        $queryType = new ObjectType([
            'name' => 'Query',
            'fields' => [
                'projects' => [
                    'type' => Type::nonNull(Type::listOf(Type::nonNull($projectType))),
                    'resolve' => function () {
                        return $this->projectService->findAll(1, 100);
                    }
                ],
                'status' => [
                    'type' => Type::listOf(Type::nonNull($statusType)),
                    'args' => [
                        'monitorIdentifier' => Type::nonNull(Type::string()),
                        'from' => Type::int(),
                        'to' => Type::int()
                    ],
                    'resolve' => function ($root, $args) {
                        $monitorId = (int) $args['monitorIdentifier'];
                        
                        // Validate monitor exists
                        $monitor = $this->monitorService->find($monitorId);
                        if (!$monitor) {
                            return [];
                        }
                        
                        // Handle date filters
                        $fromDate = null;
                        if (isset($args['from'])) {
                            $timestamp = $args['from'];
                            $fromDate = new \DateTime();
                            $fromDate->setTimestamp($timestamp);
                        }
                        
                        $toDate = null;
                        if (isset($args['to'])) {
                            $timestamp = $args['to'];
                            $toDate = new \DateTime();
                            $toDate->setTimestamp($timestamp);
                        }
                        
                        return $this->statusService->findByMonitor($monitorId, 1, 100, $fromDate, $toDate);
                    }
                ]
            ]
        ]);
        
        return new Schema([
            'query' => $queryType
        ]);
    }
} 