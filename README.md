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

- **Backend**: PHP 8.1 with Slim Framework 4
- **Frontend**: React with TypeScript, Material UI
- **Database**: PostgreSQL
- **API**: REST API and GraphQL

## Installation

### Requirements

- Docker and Docker Compose
- Git

### Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/yourusername/owleyes.git
cd owleyes
```

2. Start the application using Docker Compose:

```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - GraphQL: http://localhost:8000/graphql

## Project Structure

```
OwlEyes/
├── backend/              # PHP Slim API backend
│   ├── public/           # Public files and entry point
│   ├── src/              # Source code
│   │   ├── controllers/  # API controllers
│   │   ├── middleware/   # Middleware components
│   │   ├── models/       # Data models
│   │   └── services/     # Business logic and services
│   ├── logs/             # Application logs
│   └── check_monitors.php # CLI script for monitoring
├── frontend/             # React frontend application
│   ├── public/           # Static files
│   └── src/              # React components and logic
└── docker-compose.yml    # Docker configuration
```

## API Endpoints

### RESTful API

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
- `GET /api/monitors/{id}/status` - Get monitor status history

### GraphQL

Available at `/graphql` with the following schema:

```graphql
type Query {
  projects: [Project!]!
  status(monitorIdentifier: String!, from: Int, to: Int): [Status!]
}

type Project {
  identifier: ID!
  label: ID!
  description: ID!
  monitors: [Monitor!]
}

type Monitor {
  identifier: ID!
  periodicity: Int
  label: ID!
  type: String!
  host: String
  url: String
  badgeUrl: String!
}

type Status {
  date: String!
  ok: Boolean!
  responseTime: Int
}
```

## Monitoring

Monitors are checked periodically using a cron job that runs every minute. The check frequency for each monitor is determined by its `periodicity` setting (between 5 and 300 seconds).

## Badges

You can embed status badges for your monitors using the following URL:

```
http://localhost:8000/badge/{monitorId}
```

## License

This project is licensed under the MIT License. 