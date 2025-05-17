<?php

use DI\ContainerBuilder;
use Slim\Factory\AppFactory;
use Slim\App;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load(); // Use load() instead of safeLoad() for consistent behavior, or ensure .env exists.

// Instantiate PHP-DI ContainerBuilder
$containerBuilder = new ContainerBuilder();

// Add definitions from dependencies.php
$dependencyDefinitions = require __DIR__ . '/dependencies.php';
$containerBuilder->addDefinitions($dependencyDefinitions);

// Build PHP-DI Container instance
$container = $containerBuilder->build();

// Set container to create App with
AppFactory::setContainer($container);
$app = AppFactory::create();

// Register routes
$routes = require __DIR__ . '/routes.php';
$routes($app);

// Register middleware
$middleware = require __DIR__ . '/middleware.php';
$middleware($app);

// Add error middleware (important for development to see detailed errors)
// In production, the first argument (displayErrorDetails) should typically be false.
$app->addErrorMiddleware(true, true, true);

return $app; 