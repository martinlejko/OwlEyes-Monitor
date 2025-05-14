<?php

use DI\Container;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Create Container
$container = new Container();

// Set container to create App with AppFactory
AppFactory::setContainer($container);
$app = AppFactory::create();

// Add Error Middleware
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// Add routes
require __DIR__ . '/../src/routes.php';

// Register middleware
require __DIR__ . '/../src/middleware.php';

// Register dependencies
require __DIR__ . '/../src/dependencies.php';

// Run app
$app->run(); 