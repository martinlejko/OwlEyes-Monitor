<?php

namespace Martinlejko\Backend\Controllers;

use Martinlejko\Backend\Models\Project;
use Martinlejko\Backend\Services\ProjectService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class ProjectController
{
    private ProjectService $projectService;
    private LoggerInterface $logger;

    public function __construct(ProjectService $projectService, LoggerInterface $logger)
    {
        $this->projectService = $projectService;
        $this->logger         = $logger;
    }

    public function getAllProjects(Request $request, Response $response): Response
    {
        $queryParams = $request->getQueryParams();
        $page        = isset($queryParams['page']) ? (int)$queryParams['page'] : 1;
        $limit       = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 10;
        $labelFilter = $queryParams['label']     ?? null;
        $sortBy      = $queryParams['sortBy']    ?? null;
        $sortOrder   = $queryParams['sortOrder'] ?? 'ASC';

        // Handle tag filter
        $tagFilter = null;
        if (isset($queryParams['tags']) && is_string($queryParams['tags'])) {
            $tagFilter = explode(',', $queryParams['tags']);
            $this->logger->info('Tag filter: ' . json_encode($tagFilter));
        }

        try {
            $projects = $this->projectService->findAll($page, $limit, $labelFilter, $tagFilter, $sortBy, $sortOrder);
            $total    = $this->projectService->count($labelFilter, $tagFilter);
            $lastPage = ceil($total / $limit);

            $result = [
                'data' => array_map(fn (Project $p) => $p->toArray(), $projects),
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
            $this->logger->error('Error getting all projects: ' . $e->getMessage());
            $response->getBody()->write(json_encode(['error' => 'Failed to fetch projects']));

            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

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
                $data['tags']        ?? []
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

    public function updateProject(Request $request, Response $response, array $args): Response
    {
        $id   = (int)$args['id'];
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
