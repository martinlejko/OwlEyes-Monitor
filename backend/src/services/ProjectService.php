<?php

namespace Martinlejko\Backend\Services;

use Doctrine\DBAL\Connection;
use Martinlejko\Backend\Models\Project;
use Psr\Log\LoggerInterface;

class ProjectService
{
    private Connection $db;
    private LoggerInterface $logger;
    
    public function __construct(Connection $db, LoggerInterface $logger)
    {
        $this->db = $db;
        $this->logger = $logger;
    }
    
    public function findAll(int $page = 1, int $limit = 10, ?string $labelFilter = null, ?array $tagFilter = null, ?string $sortBy = null, ?string $sortOrder = 'ASC'): array
    {
        try {
            $offset = ($page - 1) * $limit;
            
            $queryBuilder = $this->db->createQueryBuilder()
                ->select('p.*')
                ->from('projects', 'p')
                ->setMaxResults($limit)
                ->setFirstResult($offset);
            
            // Apply filters
            if ($labelFilter) {
                $queryBuilder->andWhere('p.label LIKE :label')
                    ->setParameter('label', '%' . $labelFilter . '%');
            }
            
            // Apply tag filter
            if ($tagFilter && !empty($tagFilter)) {
                $orConditions = [];
                $index = 0;
                
                foreach ($tagFilter as $tag) {
                    $paramName = 'tag_' . $index;
                    $orConditions[] = "p.tags::text LIKE :" . $paramName;
                    $queryBuilder->setParameter($paramName, '%' . $tag . '%');
                    $index++;
                }
                
                $whereClause = '(' . implode(' OR ', $orConditions) . ')';
                $queryBuilder->andWhere($whereClause);
                
                // Log the query being built
                $this->logger->info('Tag filter query: ' . $whereClause);
                $this->logger->info('Tag filter values: ' . json_encode($tagFilter));
            }
            
            // Apply sorting
            if ($sortBy && in_array($sortBy, ['label', 'description'])) {
                $direction = ($sortOrder === 'DESC') ? 'DESC' : 'ASC';
                $queryBuilder->orderBy('p.' . $sortBy, $direction);
            }
            
            $results = $queryBuilder->executeQuery()->fetchAllAssociative();
            
            $projects = [];
            foreach ($results as $row) {
                $row['tags'] = json_decode($row['tags'], true);
                $projects[] = Project::fromArray($row);
            }
            
            return $projects;
        } catch (\Exception $e) {
            $this->logger->error('Error fetching projects: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function find(int $id): ?Project
    {
        try {
            $result = $this->db->createQueryBuilder()
                ->select('*')
                ->from('projects')
                ->where('id = :id')
                ->setParameter('id', $id)
                ->executeQuery()
                ->fetchAssociative();
            
            if (!$result) {
                return null;
            }
            
            $result['tags'] = json_decode($result['tags'], true);
            return Project::fromArray($result);
        } catch (\Exception $e) {
            $this->logger->error('Error fetching project: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function create(Project $project): Project
    {
        try {
            $this->db->insert('projects', [
                'label' => $project->getLabel(),
                'description' => $project->getDescription(),
                'tags' => json_encode($project->getTags())
            ]);
            
            $id = $this->db->lastInsertId();
            $project->setId($id);
            
            $this->logger->info('Created project with ID: ' . $id);
            return $project;
        } catch (\Exception $e) {
            $this->logger->error('Error creating project: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function update(Project $project): bool
    {
        try {
            $affected = $this->db->update(
                'projects',
                [
                    'label' => $project->getLabel(),
                    'description' => $project->getDescription(),
                    'tags' => json_encode($project->getTags())
                ],
                ['id' => $project->getId()]
            );
            
            $this->logger->info('Updated project with ID: ' . $project->getId());
            return $affected > 0;
        } catch (\Exception $e) {
            $this->logger->error('Error updating project: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function delete(int $id): bool
    {
        try {
            $affected = $this->db->delete('projects', ['id' => $id]);
            
            $this->logger->info('Deleted project with ID: ' . $id);
            return $affected > 0;
        } catch (\Exception $e) {
            $this->logger->error('Error deleting project: ' . $e->getMessage());
            throw $e;
        }
    }
    
    public function count(?string $labelFilter = null, ?array $tagFilter = null): int
    {
        try {
            $queryBuilder = $this->db->createQueryBuilder()
                ->select('COUNT(*)')
                ->from('projects', 'p');
            
            // Apply filters
            if ($labelFilter) {
                $queryBuilder->andWhere('p.label LIKE :label')
                    ->setParameter('label', '%' . $labelFilter . '%');
            }
            
            // Apply tag filter
            if ($tagFilter && !empty($tagFilter)) {
                $orConditions = [];
                $index = 0;
                
                foreach ($tagFilter as $tag) {
                    $paramName = 'tag_' . $index;
                    $orConditions[] = "p.tags::text LIKE :" . $paramName;
                    $queryBuilder->setParameter($paramName, '%' . $tag . '%');
                    $index++;
                }
                
                $whereClause = '(' . implode(' OR ', $orConditions) . ')';
                $queryBuilder->andWhere($whereClause);
                
                // Log the query being built
                $this->logger->info('Count tag filter query: ' . $whereClause);
            }
            
            return (int) $queryBuilder->executeQuery()->fetchOne();
        } catch (\Exception $e) {
            $this->logger->error('Error counting projects: ' . $e->getMessage());
            throw $e;
        }
    }
} 