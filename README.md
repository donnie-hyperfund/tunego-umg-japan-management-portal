# Tunego Management Portal

Management portal for Fango point system and live events.

## Features

- **Points System Management**: Manage point rules, transactions, and user rewards
- **Live Events Management**: Manage live events, geofences, and check-ins
- **Authentication**: Clerk-based authentication
- **Database**: Neon PostgreSQL with Drizzle ORM

## Tech Stack

- **Framework**: Next.js 15.5.3
- **Authentication**: Clerk
- **Database**: Neon (PostgreSQL)
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Clerk account and application
- A Neon database instance

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with the following variables:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL=your_neon_database_url
```

3. Run database migrations:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── points/       # Points system management
│   ├── events/       # Live events management
│   └── ...
├── lib/
│   └── db/          # Database configuration and schema
└── components/      # React components
```

## Deployment

This project is configured for deployment on Vercel. Make sure to set all environment variables in your Vercel project settings.
