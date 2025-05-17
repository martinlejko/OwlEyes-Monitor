<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    // API group
    $app->group('/api', function (RouteCollectorProxy $group) {

        // Projects routes
        $group->group('/projects', function (RouteCollectorProxy $group) {
            $group->get('', 'Martinlejko\Backend\Controllers\ProjectController:getAllProjects');
            $group->post('', 'Martinlejko\Backend\Controllers\ProjectController:createProject');
            $group->get('/{id}', 'Martinlejko\Backend\Controllers\ProjectController:getProject');
            $group->put('/{id}', 'Martinlejko\Backend\Controllers\ProjectController:updateProject');
            $group->delete('/{id}', 'Martinlejko\Backend\Controllers\ProjectController:deleteProject');
        });

        // Monitors routes
        $group->group('/monitors', function (RouteCollectorProxy $group) {
            $group->get('', 'Martinlejko\Backend\Controllers\MonitorController:getAllMonitors');
            $group->post('', 'Martinlejko\Backend\Controllers\MonitorController:createMonitor');
            $group->get('/{id}', 'Martinlejko\Backend\Controllers\MonitorController:getMonitor');
            $group->put('/{id}', 'Martinlejko\Backend\Controllers\MonitorController:updateMonitor');
            $group->delete('/{id}', 'Martinlejko\Backend\Controllers\MonitorController:deleteMonitor');
            $group->get('/{id}/status', 'Martinlejko\Backend\Controllers\MonitorController:getMonitorStatus');
        });
    });

    // Badge route
    $app->get('/badge/{id}', 'Martinlejko\Backend\Controllers\BadgeController:getBadge');

    // API Documentation routes
    $app->get('/api-docs', \Martinlejko\Backend\Controllers\ApiDocsController::class . ':getSwaggerUi');
    $app->get('/api-docs/json', \Martinlejko\Backend\Controllers\ApiDocsController::class . ':getApiDocs');

    // Home route - landing page
    $app->get('/', function (Request $request, Response $response) {
        $response->getBody()->write(file_get_contents(__DIR__ . '/../public/landing.html'));

        return $response;
    });
};
