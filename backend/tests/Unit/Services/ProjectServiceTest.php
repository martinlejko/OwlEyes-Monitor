<?php

namespace Tests\Unit\Services;

use Martinlejko\Backend\Services\ProjectService;
use Martinlejko\Backend\Models\Project;
use Tests\TestCase;
use Doctrine\DBAL\Connection;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;

class ProjectServiceTest extends TestCase
{
    /** @var Connection&MockObject */
    protected $mockDb;
    protected LoggerInterface $mockLogger;
    protected ProjectService $projectService;

    protected function shouldUseMockDb(): bool
    {
        return true;
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->mockDb = $this->getMockBuilder(Connection::class)
                              ->disableOriginalConstructor()
                              ->getMock();
        $this->mockLogger = $this->container->get('logger');
        $this->projectService = new ProjectService($this->mockDb, $this->mockLogger);
    }

    public function testGetProjects()
    {
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

        $mockQueryBuilder = $this->getMockBuilder(\Doctrine\DBAL\Query\QueryBuilder::class)
                                ->disableOriginalConstructor()
                                ->getMock();

        $mockQueryBuilder->expects(self::any())->method('select')->willReturnSelf();
        $mockQueryBuilder->expects(self::any())->method('from')->willReturnSelf();
        $mockQueryBuilder->expects(self::any())->method('setMaxResults')->willReturnSelf();
        $mockQueryBuilder->expects(self::any())->method('setFirstResult')->willReturnSelf();

        $mockResult = $this->getMockBuilder(\Doctrine\DBAL\Result::class)
                          ->disableOriginalConstructor()
                          ->getMock();
        $mockResult->expects(self::once())
                  ->method('fetchAllAssociative')
                  ->willReturn($expectedProjects);

        $mockQueryBuilder->expects(self::once())
                        ->method('executeQuery')
                        ->willReturn($mockResult);

        $this->mockDb->expects(self::once())
                     ->method('createQueryBuilder')
                     ->willReturn($mockQueryBuilder);

        $result = $this->projectService->findAll(1, 10);

        self::assertCount(2, $result);
        self::assertInstanceOf(Project::class, $result[0]);
        self::assertEquals(1, $result[0]->getId());
        self::assertEquals('Web Platform', $result[0]->getLabel());
        self::assertEquals(['web', 'production', 'critical'], json_decode($expectedProjects[0]['tags'], true));
    }

    public function testCreateProject()
    {
        $project = new Project('New Project', 'A new test project', ['test', 'new']);

        $this->mockDb->expects(self::once())
                     ->method('lastInsertId')
                     ->willReturn('1');

        $this->mockDb->expects(self::once())
                     ->method('insert')
                     ->with(
                         self::equalTo('projects'),
                         self::callback(function ($data) {
                             return $data['label'] === 'New Project' 
                                 && $data['description'] === 'A new test project' 
                                 && $data['tags'] === '["test","new"]';
                         })
                     )
                     ->willReturn(1);

        $result = $this->projectService->create($project);

        self::assertInstanceOf(Project::class, $result);
        self::assertEquals(1, $result->getId());
        self::assertEquals('New Project', $result->getLabel());
        self::assertEquals(['test', 'new'], $result->getTags());
    }
}
