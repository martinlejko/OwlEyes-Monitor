<?php

use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use Doctrine\DBAL\DriverManager;
use Martinlejko\Backend\Services\ProjectService;
use Martinlejko\Backend\Services\MonitorService;
use Martinlejko\Backend\Services\MonitorStatusService;
use Martinlejko\Backend\Services\MonitoringService;
use Martinlejko\Backend\Controllers\ProjectController;
use Martinlejko\Backend\Controllers\MonitorController;
use Martinlejko\Backend\Controllers\GraphQLController;
use Martinlejko\Backend\Controllers\BadgeController;
use Martinlejko\Backend\Controllers\ApiDocsController;

// Container Definitions
$container = $app->getContainer();

// Monolog
$container->set('logger', function (ContainerInterface $c) {
    $logger = new Logger('app');
    $logFile = __DIR__ . '/../logs/app.log';
    $logger->pushHandler(new StreamHandler($logFile, Logger::DEBUG));
    return $logger;
});

// Bind LoggerInterface to logger
$container->set(LoggerInterface::class, function (ContainerInterface $c) {
    return $c->get('logger');
});

// Database Connection
$container->set('db', function (ContainerInterface $c) {
    $connectionParams = [
        'dbname' => $_ENV['DB_NAME'],
        'user' => $_ENV['DB_USER'],
        'password' => $_ENV['DB_PASSWORD'],
        'host' => $_ENV['DB_HOST'],
        'driver' => 'pdo_pgsql',
    ];
    
    return DriverManager::getConnection($connectionParams);
});

// Services
$container->set(ProjectService::class, function (ContainerInterface $c) {
    return new ProjectService($c->get('db'), $c->get('logger'));
});

$container->set(MonitorService::class, function (ContainerInterface $c) {
    return new MonitorService($c->get('db'), $c->get('logger'));
});

$container->set(MonitorStatusService::class, function (ContainerInterface $c) {
    return new MonitorStatusService($c->get('db'), $c->get('logger'));
});

$container->set(MonitoringService::class, function (ContainerInterface $c) {
    return new MonitoringService(
        $c->get(MonitorService::class),
        $c->get(MonitorStatusService::class),
        $c->get('logger')
    );
});

// Controllers
$container->set(ProjectController::class, function (ContainerInterface $c) {
    return new ProjectController(
        $c->get(ProjectService::class),
        $c->get('logger')
    );
});

$container->set(MonitorController::class, function (ContainerInterface $c) {
    return new MonitorController(
        $c->get(MonitorService::class),
        $c->get(MonitorStatusService::class),
        $c->get(ProjectService::class),
        $c->get('logger')
    );
});

$container->set(GraphQLController::class, function (ContainerInterface $c) {
    return new GraphQLController(
        $c->get(ProjectService::class),
        $c->get(MonitorService::class),
        $c->get(MonitorStatusService::class),
        $c->get('logger')
    );
});

$container->set(BadgeController::class, function (ContainerInterface $c) {
    return new BadgeController(
        $c->get(MonitorService::class),
        $c->get(MonitorStatusService::class),
        $c->get('logger')
    );
});

$container->set(ApiDocsController::class, function (ContainerInterface $c) {
    return new ApiDocsController($c->get('logger'));
}); 