# MedNAIS SOP Marketplace

> A comprehensive platform for creating, sharing, and executing Standard Operating Procedures (SOPs) with integrated marketplace functionality.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.28-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.7.0-green)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 Features

### Core Functionality
- **📝 SOP Creation & Management** - Create detailed, step-by-step procedures with multimedia support
- **🛒 Marketplace** - Buy and sell SOPs with integrated Stripe payment processing
- **👥 Group Collaboration** - Create private groups for team SOP management
- **📊 Execution Tracking** - Monitor SOP execution with time tracking and analytics
- **🔐 Secure Authentication** - JWT-based authentication with role-based access control (User/Admin)

### Advanced Features
- **🎬 Multimedia Support** - Upload images to S3 and embed YouTube videos
- **⏱️ Timer Integration** - Built-in timers for time-sensitive procedures
- **🏷️ Category System** - Organize SOPs with admin-approved categories
- **💳 Stripe Integration** - Secure payment processing with revenue sharing (70% creator, 30% platform)
- **☁️ AWS S3 Storage** - Reliable file storage for images and assets
- **📈 Real-time Analytics** - Track execution times and success rates
- **🔍 Vector Search** - Semantic search powered by Qdrant
- **🤖 AI Generation** - OpenAI-powered SOP generation

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14.2.28** - React framework with App Router
- **React 18.2.0** - UI library
- **TypeScript 5.2.2** - Type-safe JavaScript
- **Tailwind CSS 3.3.3** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **React Hook Form + Zod** - Form validation
- **Framer Motion** - Animations

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **FastAPI** - Python backend for Stripe integration
- **Prisma 6.7.0** - Type-safe ORM (JS + Python)
- **PostgreSQL 18** - Primary database
- **JWT** - Token-based authentication

### External Services
- **Stripe** - Payment processing
- **AWS S3 / LocalStack** - File storage
- **Firebase Admin** - Additional auth features
- **OpenAI** - AI-powered generation
- **Qdrant** - Vector database for search

### DevOps
- **Docker & Docker Compose** - Containerization
- **Prisma Migrations** - Database versioning

---

## 📋 Prerequisites

- **Node.js** 18+ and **Yarn** 1.22+
- **PostgreSQL** 18+ (or Docker)
- **Python** 3.11+ (for FastAPI backend)
- **Docker** (optional, for local services)

---

## 🚦 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/N1Mee/MedNAIS.git
cd MedNAIS/mednais-analysis/mednais-sop-marketplace-main
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and fill in your values
nano .env
```

**Required environment variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random secret for JWT tokens
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `STRIPE_API_KEY` - Your Stripe secret key
- `AWS_S3_*` - AWS S3 or LocalStack credentials

See `.env.example` for complete list and descriptions.

### 3. Install Dependencies

```bash
# Install Node.js dependencies
yarn install

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Generate Prisma client
npx prisma generate
```

### 4. Start Local Services

```bash
# Start PostgreSQL, LocalStack, and Qdrant
docker-compose up -d

# Wait for services to be ready (30 seconds)
```

### 5. Run Database Migrations

```bash
# Apply all migrations
npx prisma migrate deploy

# Or create new migration if schema changed
npx prisma migrate dev --name your_migration_name
```

### 6. Seed Database (Optional)

```bash
# Seed categories
npx ts-node scripts/seed_categories.ts
```

### 7. Start Development Servers

```bash
# Terminal 1: Start Next.js
yarn dev

# Terminal 2: Start FastAPI backend
cd backend
python3 -m uvicorn server:app --reload --port 8001
```

### 8. Open Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/docs
- **Prisma Studio**: `npx prisma studio` (http://localhost:5555)

---

## 🏗️ Project Structure

```
.
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication pages
│   ├── marketplace/       # Marketplace pages
│   └── sops/              # SOP management pages
├── backend/               # FastAPI Python backend
│   ├── server.py         # FastAPI server (proxy)
│   ├── stripe_routes.py  # Stripe payment integration
│   ├── auth_utils.py     # JWT authentication utilities
│   └── requirements.txt  # Python dependencies
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── auth/             # Authentication utilities
│   ├── api/              # API utilities and validation
│   ├── aws-s3-config.ts  # S3 configuration
│   └── db.ts             # Prisma client
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── migrations/       # Migration files
├── public/               # Static assets
├── scripts/              # Utility scripts
├── docs/                 # Documentation
│   ├── OAUTH_SETUP.md         # OAuth configuration guide
│   ├── DATABASE_SETUP.md      # Database setup guide
│   └── DEPENDENCIES_NOTES.md  # Dependency management
├── docker-compose.yml         # Local development services
├── docker-compose.prod.yml    # Production deployment
├── Dockerfile                 # Production Docker image
├── .env.example              # Environment template
└── README.md                 # This file
```

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Admin and User roles
- **Input Validation** - Zod schemas for all API inputs
- **SQL Injection Prevention** - Prisma ORM parameterized queries
- **XSS Protection** - Input sanitization
- **CSRF Protection** - Built into Next.js
- **Environment Variables** - No secrets in code

---

## 🐳 Docker Deployment

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

```bash
# Build production image
docker build -t mednais-sop-marketplace .

# Or use docker-compose
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

---

## 📚 Documentation

- [OAuth Setup Guide](docs/OAUTH_SETUP.md) - Configure Google and Apple OAuth
- [Database Setup Guide](docs/DATABASE_SETUP.md) - Database configuration and migrations
- [Dependencies Notes](docs/DEPENDENCIES_NOTES.md) - Package versions and troubleshooting
- [API Documentation](docs/API.md) - API endpoint reference

---

## 🧪 Development

### Database Management

```bash
# Open Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Code Quality

```bash
# Run linter
yarn lint

# Fix linting issues
yarn lint --fix

# Type check
yarn type-check

# Format code
yarn format
```

### Testing

```bash
# Run tests (when implemented)
yarn test

# Run tests in watch mode
yarn test:watch
```

---

## 🔧 Troubleshooting

### Common Issues

#### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

#### "Database connection failed"
```bash
# Check PostgreSQL is running
docker-compose ps

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

#### "Port already in use"
```bash
# Kill process on port 3000
npx kill-port 3000

# Or change port
PORT=3001 yarn dev
```

#### "FastAPI backend not starting"
```bash
# Check Python dependencies
pip install -r backend/requirements.txt

# Check if port 8001 is available
lsof -i :8001
```

For more troubleshooting, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **MedNAIS Team**
- GitHub: [@N1Mee](https://github.com/N1Mee)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Payment processing by [Stripe](https://stripe.com/)

---

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Review [troubleshooting guide](docs/TROUBLESHOOTING.md)

---

**Last Updated**: December 11, 2025
