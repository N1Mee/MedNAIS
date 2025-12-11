# Mednais MedNAIS SOPs

A comprehensive platform for creating, sharing, and executing Standard Operating Procedures (SOPs). Built with Next.js, this marketplace enables users to buy and sell SOPs, collaborate in groups, and track execution performance.

## 🚀 Features

### Core Functionality
- **SOP Creation & Management**: Create detailed, step-by-step procedures with multimedia support
- **Marketplace**: Buy and sell SOPs with integrated payment processing
- **Group Collaboration**: Create private groups for team SOP management
- **Execution Tracking**: Monitor SOP execution with time tracking and analytics
- **Authentication**: Secure user authentication with NextAuth.js

### Advanced Features
- **Multimedia Support**: Upload images and embed YouTube videos in SOP steps
- **Timer Integration**: Built-in timers for time-sensitive procedures
- **Category System**: Organize SOPs with user-suggested categories
- **Stripe Integration**: Secure payment processing with revenue sharing
- **AWS S3 Storage**: Reliable file storage for images and assets
- **Real-time Analytics**: Track execution times and success rates

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **Framer Motion** - Animation library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Database ORM with type safety
- **PostgreSQL** - Primary database
- **NextAuth.js** - Authentication framework

### External Services
- **Stripe** - Payment processing
- **AWS S3** - File storage
- **AWS SDK** - Cloud service integration

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account (for payments)
- AWS account (for S3 storage)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/samplify-fzco/mednais-sop-marketplace.git
   cd mednais-sop-marketplace
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/sop_marketplace"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   AWS_ACCESS_KEY_ID="your-aws-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET_NAME="your-bucket-name"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma db push

   # Seed the database (optional)
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### For Users
1. **Sign Up**: Create an account or sign in with existing credentials
2. **Browse Marketplace**: Explore available SOPs for purchase
3. **Create SOPs**: Build your own procedures with step-by-step instructions
4. **Join Groups**: Collaborate with teams on shared procedures
5. **Execute SOPs**: Follow procedures with built-in timers and tracking

### For Developers
- **API Documentation**: Available at `/api` endpoints
- **Database Schema**: View in `prisma/schema.prisma`
- **Component Library**: Reusable UI components in `components/ui/`

## 🏗 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── groups/            # Group management
│   ├── marketplace/       # MedNAIS SOPs
│   ├── sops/              # SOP management
│   └── sessions/          # Execution sessions
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature-specific components
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── scripts/              # Database seeding scripts
└── types/                # TypeScript type definitions
```

## 🔧 Available Scripts

```bash
# Development
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint

# Database
yarn prisma:generate    # Generate Prisma client
yarn prisma:push        # Push schema changes
yarn prisma:studio      # Open Prisma Studio
yarn prisma:seed        # Seed database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code quality
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User sign out

### SOPs
- `GET /api/sops` - List SOPs
- `POST /api/sops` - Create SOP
- `GET /api/sops/[id]` - Get SOP details
- `PUT /api/sops/[id]` - Update SOP
- `DELETE /api/sops/[id]` - Delete SOP

### Marketplace
- `GET /api/marketplace` - List marketplace SOPs
- `POST /api/stripe/create-checkout` - Create payment session

### Groups
- `GET /api/groups` - List user groups
- `POST /api/groups` - Create group
- `POST /api/groups/join` - Join group

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |
| `AWS_REGION` | AWS region | Yes |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | Yes |

## 📈 Performance

The application includes several performance optimizations:
- **Server-Side Rendering**: Next.js SSR for faster initial loads
- **Image Optimization**: Next.js Image component for optimized images
- **Database Indexing**: Optimized Prisma queries
- **Caching**: React Query for client-side caching

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check `DATABASE_URL` in `.env`

2. **Authentication Problems**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain

3. **Stripe Payment Issues**
   - Ensure webhook endpoint is configured
   - Check Stripe dashboard for webhook events

4. **AWS S3 Upload Issues**
   - Verify AWS credentials
   - Check bucket permissions

## 📄 License

This project is proprietary software owned by Samplify FZCO.

## 👥 Support

For support or questions:
- Create an issue on GitHub
- Contact the development team

## 🔄 Recent Updates

- Enhanced execution tracking with detailed analytics
- Improved group management features
- Added category suggestion system
- Integrated advanced timer functionality
- Upgraded to Next.js 14 with App Router

---

Built with ❤️ by the Samplify Team
