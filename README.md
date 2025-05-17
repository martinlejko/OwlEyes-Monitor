<div align="center">

# 🦉 OwlEyes

### 🔍 Modern Web Service Monitoring Solution

[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4.svg?style=flat-square&logo=php)](https://php.net/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

## ✨ Overview

OwlEyes is an elegant, self-hosted monitoring solution that keeps a vigilant eye on your websites and services. With an intuitive interface and powerful monitoring capabilities, OwlEyes helps you keep track of uptime and performance for your digital assets.

## ⚡ Key Features

- 🔍 **Comprehensive Monitoring**
  - 🌐 Website availability
  - 🔄 TCP/Ping service checks
  - ⏱️ Response time tracking

- 📊 **Insightful Visualizations**
  - 📋 Clean list view of monitor results
  - 📅 Calendar view showing uptime percentage by day
  - 📈 Interactive performance graphs 

- 🔧 **Flexible Organization**
  - 📁 Group monitors into logical projects
  - 🏷️ Tag-based filtering and organization
  - 📝 Detailed descriptions and documentation

- 🛠️ **Developer-Friendly**
  - 🔌 RESTful API for integration
  - 🔖 Embeddable status badges for your documentation

## 🚀 Quick Start

### Prerequisites

- 🐳 [Docker](https://www.docker.com/get-started)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/martinlejko/OwlEyes-Monitor.git
cd OwlEyes
```

2. **Create your environment configurations**

```bash
cp postgres.env.example postgres.env
cp backend/.env.example backend/.env
# Edit .env with your preferred settings
```

3. **Start the application**

```bash
docker compose up -d
```

5. **Access the application**
   - 🖥️ **Frontend**: [http://localhost:3000](http://localhost:3000)
   - 🔌 **Backend API**: [http://localhost:8000](http://localhost:8000)
   - 📚 **API Documentation**: [http://localhost:8000/api-docs](http://localhost:8000/docs)

## 📖 Usage Guide

### Creating a Project

1. Navigate to the Projects page
2. Click the ➕ button to add a new project
3. Enter project details:
   - 📝 Label (name of your project)
   - 📄 Description (what you're monitoring)
   - 🏷️ Tags (for organization)
4. Save your new project

### Adding a Monitor

1. Open a project
2. Click the "Add Monitor" button
3. Select the monitor type:
   - 🌐 **Website Monitor**: Checks if a website is available and contains specific keywords
   - 🔄 **Ping Monitor**: Checks if a server is reachable via TCP connection
4. Configure settings:
   - 🔗 URL or host/port to monitor
   - ⏱️ Check frequency (5-300 seconds)
   - 🔍 Content verification keywords (for websites)
5. Save your new monitor

### Viewing Monitor Status

Explore your monitoring data through multiple views:

- 📋 **List View**: Chronological history of status checks
- 📅 **Calendar View**: Color-coded uptime calendar
- 📈 **Graph View**: Performance trends over time

### Using Status Badges

Add live status indicators to your documentation or website:

```markdown
![Monitor Status](http://localhost:8080/api/v1/monitors/{id}/badge)
```

## 🏗️ Architecture

OwlEyes follows a modern microservices architecture with containerized components:

### Backend Stack

- 🔧 **PHP 8.0+** with Slim 4 Framework
- 🗃️ **Doctrine DBAL** for database access
- 💾 **Postgres** database
- 📝 **Monolog** for logging
- 🧩 **PHP-DI** for dependency injection

### Frontend Stack

- ⚛️ **React 19** with React Router
- 🎨 **Material UI** for responsive components
- 📊 **Chart.js** for data visualization

### Infrastructure

- 🐳 **Docker** and Docker Compose for containerization
- 🌐 **Apache** as web server

## 🧪 Development

### Backend Development

```bash
# Start all the services by
docker compose up -d
```

This project utilizes GitHub Actions for continuous integration. As part of our CI pipeline:
- Backend tests are automatically executed.
- Linting and formatting checks are performed for both backend and frontend code to maintain code quality and consistency across the project.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🤷 Troubleshooting

Common issues when starting the application with Docker:

### Missing Environment Files

Before running `docker compose up -d`, ensure you have created the necessary environment configuration files from their examples:

1.  **PostgreSQL Configuration**:
    Copy the example file:
    ```bash
    cp postgres.env.example postgres.env
    ```
    Then, review and customize `postgres.env` if needed (e.g., if you changed default PostgreSQL credentials).

2.  **Backend Configuration**:
    Copy the example file:
    ```bash
    cp backend/.env.example backend/.env
    ```
    Then, review and customize `backend/.env` with your preferred settings (e.g., database connection details to match `postgres.env`, API keys, application settings).

After confirming these files are correctly in place and configured, try running `docker compose up -d` again. If you encounter further issues, do not hesitate and contact us 📞. 

---

<div align="center">

Made with by [Martin Lejko](https://github.com/martinlejko) and [Matus Klecka](https://github.com/tukan74)

</div>
