<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use Martinlejko\Backend\Services\ProjectService;
use PHPUnit\Framework\MockObject\MockObject;

class ProjectServiceTest extends TestCase
{
    protected $mockDb;
    protected $mockLogger;
    protected $projectService;
    
    protected function shouldUseMockDb(): bool
    {
        return true;
    }
    
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->getMockBuilder(\Doctrine\DBAL\Connection::class)
                              ->disableOriginalConstructor()
                              ->getMock();
        $this->mockLogger = $this->container->get('logger');
        $this->projectService = new ProjectService($this->mockDb, $this->mockLogger);
    }
    
    public function testGetProjects()
    {
        // Sample data that should be returned from the database
        $expectedProjects = [
            [
                'id' => 1,
                'label' => 'Web Platform',
                'description' => 'Our main web platform services',
                'tags' => '["web", "production", "critical"]'
            ],
            [
                'id' => 2,
                'label' => 'Backend APIs',
                'description' => 'Internal and external API services',
                'tags' => '["api", "backend", "services"]'
            ]
        ];
        
        // Create a mock Statement object
        $mockResult = $this->getMockBuilder(\Doctrine\DBAL\Result::class)
                           ->disableOriginalConstructor()
                           ->getMock();
        $mockResult->expects(self::once())
            ->method('fetchAllAssociative')
            ->willReturn($expectedProjects);
            
        // Set up the mock DB to return our mock statement
        $this->mockDb->expects(self::once())
            ->method('executeQuery')
            ->with(self::stringContains('SELECT * FROM projects'))
            ->willReturn($mockResult);
            
        // Call the method being tested
        $result = $this->projectService->getProjects();
        
        // Verify the result contains the expected data
        self::assertCount(2, $result);
        self::assertEquals(1, $result[0]['id']);
        self::assertEquals('Web Platform', $result[0]['label']);
        self::assertEquals(['web', 'production', 'critical'], $result[0]['tags']);
    }
    
    public function testCreateProject()
    {
        $projectData = [
            'label' => 'New Project',
            'description' => 'A new test project',
            'tags' => ['test', 'new']
        ];
        
        // Mock the connection to return 1 for lastInsertId
        $this->mockDb->expects(self::once())
            ->method('lastInsertId')
            ->willReturn('1');
            
        // Expect insert to be called with the right table
        $this->mockDb->expects(self::once())
            ->method('insert')
            ->with(
                self::equalTo('projects'),
                self::callback(function($data) {
                    return $data['label'] === 'New Project' && 
                           $data['description'] === 'A new test project' &&
                           $data['tags'] === '["test","new"]';
                })
            )
            ->willReturn(1);
            
        // Call the method being tested
        $projectId = $this->projectService->createProject($projectData);
        
        // Verify the project ID is returned
        self::assertEquals(1, $projectId);
    }
} 