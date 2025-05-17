<?php

use DI\ContainerBuilder;
use Slim\Factory\AppFactory;
use Slim\App;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load(); 

$containerBuilder = new ContainerBuilder();

$dependencyDefinitions = require __DIR__ . '/dependencies.php';
$containerBuilder->addDefinitions($dependencyDefinitions);

$container = $containerBuilder->build();

AppFactory::setContainer($container);
$app = AppFactory::create();

$routes = require __DIR__ . '/routes.php';
$routes($app);

$middleware = require __DIR__ . '/middleware.php';
$middleware($app);

$app->addErrorMiddleware(true, true, true);

return $app; 