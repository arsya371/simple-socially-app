import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Allow Next internals and static assets
  if (pathname.startsWith('/_next') || /\.[\w]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow API routes through (status/auth endpoints included)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  try {
    const statusRes = await fetch(new URL('/api/system/status', url), { cache: 'no-store' });
    if (statusRes.ok) {
      const { live } = await statusRes.json();
      if (!live) {
        // Only admins can bypass maintenance
        const adminRes = await fetch(new URL('/api/auth/is-admin', url), {
          cache: 'no-store',
          headers: { cookie: req.headers.get('cookie') ?? '' }
        });
        const { isAdmin } = adminRes.ok ? await adminRes.json() : { isAdmin: false };

        if (!isAdmin) {
          if (pathname === '/maintenance') return NextResponse.next();
          const maintenanceUrl = new URL('/maintenance', url);
          maintenanceUrl.searchParams.set('from', pathname);
          return NextResponse.redirect(maintenanceUrl);
        }
      }
    }
  } catch {
    // Fail open
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};