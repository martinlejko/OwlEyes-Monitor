<div align="center">

# 🦉 OwlEyes

### 🔍 Modern Web Service Monitoring Solution

[![PHP](https://img.shields.io/badge/PHP-8.2-777BB4.svg?style=flat-square&logo=php)](https://php.net/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square&logo=react)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

## ✨ Overview

OwlEyes is an elegant, self-hosted monitoring solution that keeps a vigilant eye on your websites and services. With an intuitive interface and powerful monitoring capabilities, OwlEyes helps you ensure maximum uptime and performance for your digital assets.

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=OwlEyes+Dashboard" alt="OwlEyes Dashboard" width="80%"/>
</p>

## ⚡ Key Features

- 🔍 **Comprehensive Monitoring**
  - 🌐 Website availability & content verification
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
  - 🧩 GraphQL support for flexible queries
  - 🔖 Embeddable status badges for your documentation

## 🚀 Quick Start

### Prerequisites

- 🐳 [Docker](https://www.docker.com/get-started) and Docker Compose
- 🧰 Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/martinlejko/OwlEyes.git
cd OwlEyes
```

2. **Create your environment configuration**

```bash
cp .env.example .env
# Edit .env with your preferred settings
```

3. **Run the setup script**

```bash
chmod +x setup.sh
./setup.sh
```

4. **Start the application**

```bash
docker compose up -d
```

5. **Access the application**
   - 🖥️ **Frontend**: [http://localhost:3000](http://localhost:3000)
   - 🔌 **Backend API**: [http://localhost:8080](http://localhost:8080)
   - 📚 **API Documentation**: [http://localhost:8080/docs](http://localhost:8080/docs)

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

- 🔧 **PHP 8.2** with Slim 4 Framework
- 🗃️ **Doctrine ORM** for database access
- 💾 **MySQL** database
- 📝 **Monolog** for logging
- 🧩 **PHP-DI** for dependency injection
- 🔌 **GraphQL** with webonyx/graphql-php

### Frontend Stack

- ⚛️ **React 18** with React Router
- 🎨 **Material UI** for responsive components
- 📊 **Chart.js** for data visualization
- 📅 **FullCalendar** for calendar view

### Infrastructure

- 🐳 **Docker** and Docker Compose for containerization
- 🌐 **Nginx** as web server

## 🧪 Development

### Backend Development

```bash
# Start only backend services
docker compose up -d backend db

# Run PHP code style checks
docker compose exec backend composer cs-check

# Run tests
docker compose exec backend composer test
```

### Frontend Development

```bash
# Start frontend in development mode
docker compose up -d frontend

# Or run locally with npm
cd frontend
npm install
npm run dev
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Slim Framework](https://www.slimframework.com/) - PHP micro framework
- [Doctrine ORM](https://www.doctrine-project.org/) - Object-relational mapper
- [React](https://reactjs.org/) - Frontend library
- [Material UI](https://mui.com/) - React component library
- [Vite](https://vitejs.dev/) - Frontend build tool

---

<div align="center">

Made with ❤️ by [Martin Lejko](https://github.com/martinlejko)

</div>
