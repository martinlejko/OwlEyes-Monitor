<?php

use Doctrine\DBAL\DriverManager;
use Martinlejko\Backend\Controllers\ApiDocsController;
use Martinlejko\Backend\Controllers\BadgeController;
use Martinlejko\Backend\Controllers\MonitorController;
use Martinlejko\Backend\Controllers\ProjectController;
use Martinlejko\Backend\Services\MonitoringService;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Martinlejko\Backend\Services\ProjectService;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use DI\ContainerBuilder;

return [
    // Logger
    LoggerInterface::class => function (ContainerInterface $c) {
        $logger  = new Logger('app');
        $logFile = __DIR__ . '/../logs/app.log'; // Ensure this path is writable
        $logger->pushHandler(new StreamHandler($logFile, Logger::DEBUG));
        return $logger;
    },
    'logger' => DI\get(LoggerInterface::class),

    // Database Connection
    'db' => function (ContainerInterface $c) {
        $connectionParams = [
            'dbname'   => $_ENV['DB_NAME'],
            'user'     => $_ENV['DB_USER'],
            'password' => $_ENV['DB_PASSWORD'],
            'host'     => $_ENV['DB_HOST'],
            'driver'   => 'pdo_pgsql',
        ];
        return DriverManager::getConnection($connectionParams);
    },
    Doctrine\DBAL\Connection::class => DI\get('db'),

    // Services
    ProjectService::class => function (ContainerInterface $c) {
        return new ProjectService($c->get('db'), $c->get(LoggerInterface::class));
    },
    MonitorService::class => function (ContainerInterface $c) {
        return new MonitorService($c->get('db'), $c->get(LoggerInterface::class));
    },
    MonitorStatusService::class => function (ContainerInterface $c) {
        return new MonitorStatusService($c->get('db'), $c->get(LoggerInterface::class));
    },
    MonitoringService::class => function (ContainerInterface $c) {
        return new MonitoringService(
            $c->get(MonitorService::class),
            $c->get(MonitorStatusService::class),
            $c->get(LoggerInterface::class)
        );
    },

    // Controllers
    ProjectController::class => function (ContainerInterface $c) {
        return new ProjectController(
            $c->get(ProjectService::class),
            $c->get(LoggerInterface::class)
        );
    },
    MonitorController::class => function (ContainerInterface $c) {
        return new MonitorController(
            $c->get(MonitorService::class),
            $c->get(MonitorStatusService::class),
            $c->get(ProjectService::class),
            $c->get(LoggerInterface::class)
        );
    },
    BadgeController::class => function (ContainerInterface $c) {
        return new BadgeController(
            $c->get(MonitorService::class),
            $c->get(MonitorStatusService::class),
            $c->get(LoggerInterface::class)
        );
    },
    ApiDocsController::class => function (ContainerInterface $c) {
        return new ApiDocsController($c->get(LoggerInterface::class));
    },
];
