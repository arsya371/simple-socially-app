# Social Media Web Application

A modern, feature-rich social media platform built with Next.js 13/14, featuring user authentication, post management, admin controls, and real-time notifications.

## Features

### User Features
- **Authentication** - Secure user authentication powered by Clerk
- **User Profiles** - Customizable user profiles with avatars and bio
- **Posts** - Create, read, update, and delete posts
- **Follow System** - Follow/unfollow other users
- **Notifications** - Real-time notifications for likes, comments, and follows
- **Image Upload** - Upload and share images in posts using UploadThing

### Admin Features
- **User Management** - Manage users, roles, and permissions
- **Content Moderation** - Monitor and moderate posts and comments
- **Report System** - Handle user reports and content flags
- **Site Settings** - Configure global site settings
- **Analytics** - Track user engagement and content metrics

### Technical Features
- **Server Actions** - Utilizes Next.js server actions for data mutations
- **Dynamic Routing** - Advanced routing with dynamic segments
- **Real-time Updates** - Server-sent events for live updates
- **Responsive Design** - Mobile-first UI with Tailwind CSS
- **Type Safety** - Full TypeScript support
- **Database** - PostgreSQL with Prisma ORM

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Auth**: Clerk
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS + Shadcn UI
- **File Upload**: UploadThing
- **State Management**: React Hooks + Context
- **Icons**: Lucide React

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- PostgreSQL
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# UploadThing
UPLOADTHING_SECRET=sk_...
UPLOADTHING_APP_ID=...
```

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd code
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── actions/         # Server actions for data mutations
├── app/            # Next.js app router pages and layouts
├── components/     # Reusable React components
├── lib/           # Utility functions and configurations
└── types/         # TypeScript type definitions

prisma/
├── schema.prisma   # Database schema
└── migrations/     # Database migrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Routes

### Admin API
- `POST /api/admin/settings` - Update site settings
- `POST /api/admin/actions/suspend-account` - Suspend user account
- `POST /api/admin/actions/delete-content` - Delete user content
- `GET /api/admin/reports` - Get content reports

### User API
- `POST /api/tasks` - Create new task
- `GET /api/tasks` - Get user tasks
- Various auth-related endpoints handled by Clerk

## Role-Based Access Control

The application implements three user roles:
- `USER` - Standard user access
- `MODERATOR` - Content moderation capabilities
- `ADMIN` - Full administrative access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential. All rights reserved.
