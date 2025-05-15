<?php

namespace Martinlejko\Backend\Controllers;

use Martinlejko\Backend\Models\Project;
use Martinlejko\Backend\Services\ProjectService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *     title="OwlEyes Monitoring API",
 *     version="1.0.0",
 *     description="API for the OwlEyes monitoring service",
 *     @OA\Contact(email="info@owleyes.com")
 * )
 * @OA\Server(
 *     url="/api",
 *     description="API Server"
 * )
 * @OA\Tag(
 *     name="Projects",
 *     description="Operations related to Projects"
 * )
 * @OA\Tag(
 *     name="Monitors",
 *     description="Operations related to Monitors"
 * )
 * @OA\Schema(
 *     schema="Project",
 *     required={"id", "label"},
 *     @OA\Property(
 *         property="id",
 *         type="integer",
 *         format="int64",
 *         description="Project unique ID"
 *     ),
 *     @OA\Property(
 *         property="label",
 *         type="string",
 *         description="Project name"
 *     ),
 *     @OA\Property(
 *         property="description",
 *         type="string",
 *         description="Project description"
 *     ),
 *     @OA\Property(
 *         property="tags",
 *         type="array",
 *         description="List of tags",
 *         @OA\Items(type="string")
 *     ),
 * )
 */
class ProjectController
{
    private ProjectService $projectService;
    private LoggerInterface $logger;
    
    public function __construct(ProjectService $projectService, LoggerInterface $logger)
    {
        $this->projectService = $projectService;
        $this->logger = $logger;
    }
    
    /**
     * @OA\Get(
     *     path="/projects",
     *     summary="Get all projects with pagination and filtering",
     *     tags={"Projects"},
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Page number",
     *         required=false,
     *         @OA\Schema(type="integer", default=1)
     *     ),
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         description="Items per page",
     *         required=false,
     *         @OA\Schema(type="integer", default=10)
     *     ),
     *     @OA\Parameter(
     *         name="label",
     *         in="query",
     *         description="Filter by label",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="tags",
     *         in="query",
     *         description="Filter by tags (comma-separated)",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="sortBy",
     *         in="query",
     *         description="Field to sort by",
     *         required=false,
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="sortOrder",
     *         in="query",
     *         description="Sort direction",
     *         required=false,
     *         @OA\Schema(type="string", enum={"ASC", "DESC"}, default="ASC")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="List of projects",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/Project")
     *             ),
     *             @OA\Property(
     *                 property="meta",
     *                 type="object",
     *                 @OA\Property(property="currentPage", type="integer"),
     *                 @OA\Property(property="lastPage", type="integer"),
     *                 @OA\Property(property="perPage", type="integer"),
     *                 @OA\Property(property="total", type="integer"),
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
    public function getAllProjects(Request $request, Response $response): Response
    {
        $queryParams = $request->getQueryParams();
        $page = isset($queryParams['page']) ? (int)$queryParams['page'] : 1;
        $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 10;
        $labelFilter = $queryParams['label'] ?? null;
        $sortBy = $queryParams['sortBy'] ?? null;
        $sortOrder = $queryParams['sortOrder'] ?? 'ASC';
        
        // Handle tag filter
        $tagFilter = null;
        if (isset($queryParams['tags']) && is_string($queryParams['tags'])) {
            $tagFilter = explode(',', $queryParams['tags']);
        }
        
        try {
            $projects = $this->projectService->findAll($page, $limit, $labelFilter, $tagFilter, $sortBy, $sortOrder);
            $total = $this->projectService->count($labelFilter, $tagFilter);
            $lastPage = ceil($total / $limit);
            
            $result = [
                'data' => array_map(fn(Project $p) => $p->toArray(), $projects),
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
            $this->logger->error('Error getting all projects: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to fetch projects']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    /**
     * @OA\Get(
     *     path="/projects/{id}",
     *     summary="Get a specific project by ID",
     *     tags={"Projects"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Project ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Project details",
     *         @OA\JsonContent(ref="#/components/schemas/Project")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Project not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Project not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
    public function getProject(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        
        try {
            $project = $this->projectService->find($id);
            
            if (!$project) {
                $response->getBody()->write(json_encode(['error' => 'Project not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            $response->getBody()->write(json_encode($project->toArray()));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error getting project: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to fetch project']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    /**
     * @OA\Post(
     *     path="/projects",
     *     summary="Create a new project",
     *     tags={"Projects"},
     *     @OA\RequestBody(
     *         required=true,
     *         description="Project data",
     *         @OA\JsonContent(
     *             required={"label"},
     *             @OA\Property(
     *                 property="label",
     *                 type="string",
     *                 description="Project name"
     *             ),
     *             @OA\Property(
     *                 property="description",
     *                 type="string",
     *                 description="Project description",
     *                 example="My project description"
     *             ),
     *             @OA\Property(
     *                 property="tags",
     *                 type="array",
     *                 description="List of tags",
     *                 @OA\Items(type="string"),
     *                 example={"web", "production"}
     *             ),
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Project created",
     *         @OA\JsonContent(ref="#/components/schemas/Project")
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Bad request"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
    public function createProject(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        try {
            // Validate input
            if (empty($data['label'])) {
                $response->getBody()->write(json_encode(['error' => 'Project label is required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            // Create project
            $project = new Project(
                $data['label'],
                $data['description'] ?? '',
                $data['tags'] ?? []
            );
            
            $project = $this->projectService->create($project);
            
            $response->getBody()->write(json_encode($project->toArray()));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error creating project: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to create project']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    /**
     * @OA\Put(
     *     path="/projects/{id}",
     *     summary="Update an existing project",
     *     tags={"Projects"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Project ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         description="Project data to update",
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="label",
     *                 type="string",
     *                 description="Project name"
     *             ),
     *             @OA\Property(
     *                 property="description",
     *                 type="string",
     *                 description="Project description"
     *             ),
     *             @OA\Property(
     *                 property="tags",
     *                 type="array",
     *                 description="List of tags",
     *                 @OA\Items(type="string")
     *             ),
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Project updated",
     *         @OA\JsonContent(ref="#/components/schemas/Project")
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Bad request"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Project not found"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
    public function updateProject(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        $data = $request->getParsedBody();
        
        try {
            // Check if project exists
            $project = $this->projectService->find($id);
            
            if (!$project) {
                $response->getBody()->write(json_encode(['error' => 'Project not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Update project properties
            if (isset($data['label'])) {
                $project->setLabel($data['label']);
            }
            
            if (isset($data['description'])) {
                $project->setDescription($data['description']);
            }
            
            if (isset($data['tags'])) {
                $project->setTags($data['tags']);
            }
            
            // Save changes
            $success = $this->projectService->update($project);
            
            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'No changes made to project']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            
            $response->getBody()->write(json_encode($project->toArray()));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $this->logger->error('Error updating project: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to update project']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    
    /**
     * @OA\Delete(
     *     path="/projects/{id}",
     *     summary="Delete a project",
     *     tags={"Projects"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Project ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=204,
     *         description="Project deleted successfully"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Project not found"
     *     ),
     *     @OA\Response(
     *         response=500,
     *         description="Server error"
     *     )
     * )
     */
    public function deleteProject(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];
        
        try {
            // Check if project exists
            $project = $this->projectService->find($id);
            
            if (!$project) {
                $response->getBody()->write(json_encode(['error' => 'Project not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            
            // Delete project
            $success = $this->projectService->delete($id);
            
            if (!$success) {
                $response->getBody()->write(json_encode(['error' => 'Failed to delete project']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
            
            return $response->withStatus(204);
        } catch (\Exception $e) {
            $this->logger->error('Error deleting project: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to delete project']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
} 