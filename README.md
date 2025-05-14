# OwlEyes Monitoring Service

OwlEyes is a comprehensive monitoring solution that helps you track the status of your services in real-time. Create projects, set up monitors, and never miss downtime again.

## Features

- **Project Management**: Create and organize multiple projects with custom labels, descriptions, and tags
- **Ping Monitoring**: Check if your servers are up by establishing TCP connections
- **Website Monitoring**: Monitor websites for availability, status codes, and specific content
- **Status Badges**: Add status badges to your README or website to show real-time monitoring status
- **Multiple Views**: View monitor history in list, calendar, or graph mode with real-time updates
- **API Access**: Access all functionality through RESTful API or GraphQL interface

## Technology Stack

- **Backend**: PHP 8.1 with Slim Framework
- **Frontend**: React with TypeScript and Material UI
- **Database**: PostgreSQL
- **Infrastructure**: Docker and Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/owleyes.git
   cd owleyes
   ```

2. Copy environment files
   ```bash
   cp backend/.env.example backend/.env
   ```

3. Start the application
   ```bash
   docker-compose up -d
   ```

4. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - GraphQL: http://localhost:8000/graphql

## Development

### Backend

The backend is built with PHP 8.1 using the Slim Framework. It provides a RESTful API and GraphQL interface for interacting with the application.

```bash
# Enter the backend container
docker exec -it owleyes-backend bash

# Run composer commands
composer install
```

### Frontend

The frontend is built with React, TypeScript, and Material UI. It provides a user-friendly interface for managing projects and monitors.

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

### Database

The database is PostgreSQL and is automatically initialized with the schema and sample data when the container starts.

## Testing

### Backend Tests

The application includes a comprehensive test suite for the backend:

```bash
# Enter the backend container
docker exec -it owleyes-backend bash

# Run all tests
composer test

# Run only unit tests
composer test:unit

# Run only integration tests
composer test:integration
```

Test types:
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test API endpoints and component interactions

For more details, see [backend/tests/README.md](backend/tests/README.md).

## API Documentation

### REST API

The REST API provides endpoints for managing projects, monitors, and accessing monitor statuses.

- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get a specific project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/{id}` - Update a project
- `DELETE /api/projects/{id}` - Delete a project
- `GET /api/monitors` - List all monitors
- `GET /api/monitors/{id}` - Get a specific monitor
- `POST /api/monitors` - Create a new monitor
- `PUT /api/monitors/{id}` - Update a monitor
- `DELETE /api/monitors/{id}` - Delete a monitor
- `GET /api/monitors/{id}/status` - Get status history for a monitor
- `GET /badge/{id}` - Get a status badge for a monitor

### GraphQL

The GraphQL API provides a flexible query interface for accessing projects, monitors, and statuses.

Example query:
```graphql
{
  projects {
    identifier
    label
    description
    monitors {
      identifier
      label
      type
    }
  }
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 