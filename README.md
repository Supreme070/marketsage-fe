# MarketSage

A comprehensive marketing automation platform designed for the Nigerian and African market, with support for email, SMS, and WhatsApp marketing campaigns.

## Features

- **Role-Based Access Control**: Four user roles (Super Admin, Admin, IT Admin, Regular User) with specific permissions
- **Contact Management**: Store and manage contacts with Nigerian and African market-specific fields
- **Multi-Channel Campaigns**: Create and manage email, SMS, and WhatsApp campaigns
- **Visual Workflow Editor**: Build complex marketing automations with a drag-and-drop interface
- **Email Template Editor**: Design email templates with a visual editor
- **Analytics and Reporting**: Track campaign performance and user engagement

## Tech Stack

- **Frontend**: Next.js 15+, React 18+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Prisma adapter
- **External Services**: WhatsApp Business API, SMS providers, Email services

## Prerequisites

- Node.js v20+ or Bun
- PostgreSQL 16+ (or Docker for containerized setup)
- Git

## Getting Started

### Option 1: Local Development

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/marketsage.git
cd marketsage
```

2. **Install dependencies**

```bash
# Using npm
npm install

# Using Bun (recommended)
bun install
```

3. **Set up environment variables**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your database and service credentials.

4. **Initialize the database**

```bash
# Generate Prisma client
npm run db:generate

# Initialize database (creates DB if not exists, runs migrations and seeds)
npm run db:init
```

5. **Start the development server**

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Option 2: Docker Development Environment

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/marketsage.git
cd marketsage
```

2. **Set up environment variables**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file as needed.

3. **Build and start Docker containers**

```bash
# Build containers
npm run docker:build

# Start services
npm run docker:up
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Default Users

After running the seed script, the following users are created:

| Role | Email | Password | Name |
|------|-------|----------|------|
| Super Admin | supreme@marketsage.africa | MS_Super2025! | Supreme Admin |
| Admin | anita@marketsage.africa | MS_Admin2025! | Anita Manager |
| IT Admin | kola@marketsage.africa | MS_ITAdmin2025! | Kola Techleads |
| Regular User | user@marketsage.africa | MS_User2025! | Regular User |

## Docker Setup

This project includes multiple Docker configuration files for different environments and purposes:

### Docker Files

| File | Purpose | Description |
|------|---------|-------------|
| `Dockerfile` | Production | Multi-stage build optimized for production deployment. Creates a standalone Node.js application with all necessary dependencies. |
| `Dockerfile.dev` | Development | Simplified build for development environment with hot-reloading and debugging capabilities. |

### Docker Compose Files

| File | Purpose | Services |
|------|---------|----------|
| `docker-compose.yml` | Full Stack | Complete development environment with web application, PostgreSQL database, and database seeder. |
| `docker-compose.db-only.yml` | Database Only | Runs only the PostgreSQL database with optimized settings for local development. |

### Running with Docker

#### Full Stack Development

```bash
# Build and start all services
docker compose build
docker compose up -d

# Access the application at http://localhost:3030
```

#### Database Only Mode

```bash
# Start only the database with optimized settings
docker compose -f docker-compose.db-only.yml up -d

# Run the application locally
npm run dev
```

#### Stopping Containers

```bash
# Stop all containers
docker compose down

# Stop only the database
docker compose -f docker-compose.db-only.yml down
```

## Project Structure

```
marketsage/
├── prisma/                  # Prisma schema and migrations
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Database seed
├── public/                  # Static assets
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Authentication routes
│   │   ├── (dashboard)/    # Dashboard routes
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard UI components
│   │   ├── email-editor/   # Email editor components
│   │   ├── workflow-editor/# Workflow editor components
│   │   └── ui/             # UI components (shadcn/ui)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   │   ├── auth/           # Authentication utilities
│   │   └── db/             # Database utilities
│   ├── scripts/            # CLI scripts
│   └── types/              # TypeScript types
├── .env                     # Environment variables
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Docker container definition
└── package.json             # Dependencies and scripts
```

## Development Workflow

### Database Changes

1. Update the Prisma schema in `prisma/schema.prisma`
2. Generate a migration:

```bash
npm run db:migrate
```

3. Apply the migration:

```bash
npm run db:deploy
```

### Adding New Features

1. Create a new branch for your feature
2. Implement the feature with tests
3. Create a pull request for review

## Deployment

### Production Deployment

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm run start
```

### Docker Deployment

For production deployment with Docker:

```bash
# Build production images
docker compose build

# Start services in detached mode
docker compose up -d

# To view logs
docker compose logs -f
```

## License

[Specify your license here]

## Contributors

[Add contributors list here]
