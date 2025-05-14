<?php

use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Psr\Container\ContainerInterface;
use Doctrine\DBAL\DriverManager;

// Container Definitions
$container = $app->getContainer();

// Monolog
$container->set('logger', function (ContainerInterface $c) {
    $logger = new Logger('app');
    $logFile = __DIR__ . '/../logs/app.log';
    $logger->pushHandler(new StreamHandler($logFile, Logger::DEBUG));
    return $logger;
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