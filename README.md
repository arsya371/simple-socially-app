<h1 align="center">Simple Social App</h1>
Highlights:

🚀 Tech stack: Next.js App Router, Postgres, Prisma, Clerk & TypeScript
- Server Components, Layouts, Route Handlers, Server Actions
- loading.tsx, error.tsx, not-found.tsx
- API Integration using Route Handlers
- Data Fetching, Caching & Revalidation
- Client & Server Components
- Dynamic & Static Routes
- Styling with Tailwind & Shadcn
- Authentication & Authorization
- File Uploads with UploadThing
- Database Integration with Prisma
- Server Actions & Forms
- Optimistic Updates

### Setup .env file

```js
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
UPLOADTHING_TOKEN=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
PRISMA_CLIENT_ENGINE_TYPE="dataproxy"
PRISMA_CONNECTION_LIMIT=10
PRISMA_QUERY_ENGINE_POOL=5
PRISMA_CONNECTION_TIMEOUT=20000
PRISMA_POOL_TIMEOUT=10000
INTERNAL_SECRET=
```

### Run the app

```shell
npm run dev
```
