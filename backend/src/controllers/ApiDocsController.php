<?php

namespace Martinlejko\Backend\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use OpenApi\Annotations as OA;
use Psr\Log\LoggerInterface;

/**
 * @OA\OpenApi(
 *     openapi="3.0.0"
 * )
 * @OA\Info(
 *     title="OwlEyes Monitor API",
 *     version="1.0.0",
 *     description="API for the OwlEyes Monitor application",
 *     @OA\Contact(
 *         email="martinlejko@outlook.com",
 *         name="API Support"
 *     )
 * )
 * @OA\Server(
 *     url="/api",
 *     description="API Server"
 * )
 */
class ApiDocsController
{
    protected $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Generate and serve OpenAPI documentation
     */
    public function getApiDocs(Request $request, Response $response): Response
    {
        $this->logger->info("API Docs requested");
        
        // Use a static OpenAPI specification instead of dynamic generation
        $openApiJson = <<<JSON
{
    "openapi": "3.0.0",
    "info": {
        "title": "OwlEyes Monitor API",
        "description": "API for the OwlEyes Monitor application",
        "version": "1.0.0",
        "contact": {
            "email": "admin@owleyes.com",
            "name": "API Support"
        }
    },
    "servers": [
        {
            "url": "/",
            "description": "API Server"
        }
    ],
    "paths": {
        "/api/projects": {
            "get": {
                "summary": "Get all projects",
                "tags": ["Projects"],
                "responses": {
                    "200": {
                        "description": "List of all projects",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": { "type": "integer" },
                                            "name": { "type": "string" },
                                            "description": { "type": "string" },
                                            "created_at": { "type": "string", "format": "date-time" },
                                            "updated_at": { "type": "string", "format": "date-time" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "summary": "Create a new project",
                "tags": ["Projects"],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["name"],
                                "properties": {
                                    "name": { "type": "string" },
                                    "description": { "type": "string" }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Project created successfully"
                    },
                    "400": {
                        "description": "Invalid input"
                    }
                }
            }
        },
        "/api/projects/{id}": {
            "get": {
                "summary": "Get a project by ID",
                "tags": ["Projects"],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "description": "Project ID",
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Project details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "id": { "type": "integer" },
                                        "name": { "type": "string" },
                                        "description": { "type": "string" },
                                        "created_at": { "type": "string", "format": "date-time" },
                                        "updated_at": { "type": "string", "format": "date-time" }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Project not found"
                    }
                }
            },
            "put": {
                "summary": "Update a project",
                "tags": ["Projects"],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "description": "Project ID",
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name": { "type": "string" },
                                    "description": { "type": "string" }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Project updated successfully"
                    },
                    "400": {
                        "description": "Invalid input"
                    },
                    "404": {
                        "description": "Project not found"
                    }
                }
            },
            "delete": {
                "summary": "Delete a project",
                "tags": ["Projects"],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "description": "Project ID",
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Project deleted successfully"
                    },
                    "404": {
                        "description": "Project not found"
                    }
                }
            }
        },
        "/api/monitors": {
            "get": {
                "summary": "Get all monitors",
                "tags": ["Monitors"],
                "responses": {
                    "200": {
                        "description": "List of all monitors",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": { "type": "integer" },
                                            "name": { "type": "string" },
                                            "url": { "type": "string" },
                                            "project_id": { "type": "integer" },
                                            "check_interval": { "type": "integer" },
                                            "created_at": { "type": "string", "format": "date-time" },
                                            "updated_at": { "type": "string", "format": "date-time" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "summary": "Create a new monitor",
                "tags": ["Monitors"],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["name", "url", "project_id", "check_interval"],
                                "properties": {
                                    "name": { "type": "string" },
                                    "url": { "type": "string" },
                                    "project_id": { "type": "integer" },
                                    "check_interval": { 
                                        "type": "integer",
                                        "description": "Check interval in seconds"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Monitor created successfully"
                    },
                    "400": {
                        "description": "Invalid input"
                    }
                }
            }
        },
        "/api/monitors/{id}": {
            "get": {
                "summary": "Get a monitor by ID",
                "tags": ["Monitors"],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "description": "Monitor ID",
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Monitor details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "id": { "type": "integer" },
                                        "name": { "type": "string" },
                                        "url": { "type": "string" },
                                        "project_id": { "type": "integer" },
                                        "check_interval": { "type": "integer" },
                                        "created_at": { "type": "string", "format": "date-time" },
                                        "updated_at": { "type": "string", "format": "date-time" }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Monitor not found"
                    }
                }
            },
            "put": {
                "summary": "Update a monitor",
                "tags": ["Monitors"],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "description": "Monitor ID",
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name": { "type": "string" },
                                    "url": { "type": "string" },
                                    "project_id": { "type": "integer" },
                                    "check_interval": { "type": "integer" }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Monitor updated successfully"
                    },
                    "400": {
                        "description": "Invalid input"
                    },
                    "404": {
                        "description": "Monitor not found"
                    }
                }
            },
            "delete": {
                "summary": "Delete a monitor",
                "tags": ["Monitors"],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "description": "Monitor ID",
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Monitor deleted successfully"
                    },
                    "404": {
                        "description": "Monitor not found"
                    }
                }
            }
        },
        "/api/monitors/{id}/status": {
            "get": {
                "summary": "Get monitor status",
                "tags": ["Monitors"],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "description": "Monitor ID",
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Monitor status information",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "id": { "type": "integer" },
                                        "monitor_id": { "type": "integer" },
                                        "status": { 
                                            "type": "string",
                                            "enum": ["up", "down", "unknown"]
                                        },
                                        "response_time": { "type": "integer" },
                                        "status_code": { "type": "integer" },
                                        "checked_at": { "type": "string", "format": "date-time" }
                                    }
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Monitor not found"
                    }
                }
            }
        }, 
        "/badge/{id}": {
            "get": {
                "summary": "Get status badge for a monitor",
                "tags": ["Badges"],
                "parameters": [
                    {
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "description": "Monitor ID",
                        "schema": {
                            "type": "integer"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "SVG badge showing monitor status",
                        "content": {
                            "image/svg+xml": {
                                "schema": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "Monitor not found"
                    }
                }
            }
        }
    }
}
JSON;
        
        $response->getBody()->write($openApiJson);
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Serve Swagger UI
     */
    public function getSwaggerUi(Request $request, Response $response): Response
    {
        $this->logger->info("Swagger UI requested");
        
        // Simple Swagger UI HTML
        $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OwlEyes Monitor - API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .swagger-ui .topbar { background-color: #3b4151; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "/api-docs/json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
            window.ui = ui;
        };
    </script>
</body>
</html>
HTML;

        $response->getBody()->write($html);
        return $response->withHeader('Content-Type', 'text/html');
    }
} 