import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define routes that should be accessible without authentication
const publicRoutes = ["/", "/auth/maintenance", "/auth/sign-in", "/auth/sign-up"];
const protectedRoutes = ["/messages", "/profile", "/admin", "/moderator", "/developer"];

// Sign-up related paths that should be blocked when registration is disabled
const signUpPaths = [
  "/auth/sign-up",
  "/auth/sign-up/(.*)",  // Catch all sign-up related routes
  "/api/auth/register",
  "/api/sign-up"
];

// List of paths that should be accessible during maintenance mode
const maintenanceAllowedPaths = [
  "/admin",
  "/api/admin",
  "/admin/settings"
];

// Cache settings for 5 seconds to reduce API calls
const CACHE_TTL = 5000;
let settingsCache = {
  data: null as any,
  timestamp: 0
};

async function getSettings() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (settingsCache.data && (now - settingsCache.timestamp) < CACHE_TTL) {
    return settingsCache.data;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/settings`, {
      headers: {
        "x-internal-request": process.env.INTERNAL_SECRET || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`);
    }

    const data = await response.json();
    
    // Update cache
    settingsCache = {
      data,
      timestamp: now
    };

    return data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {
      maintenanceMode: false,
      userRegistration: true
    };
  }
}

// Custom maintenance and registration middleware
async function maintenanceMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip maintenance checks for allowed paths
  if (path === "/maintenance" || publicRoutes.includes(path)) {
    return null;
  }

  // Skip settings check for internal API routes
  if (path.startsWith('/api/internal/')) {
    return null;
  }

  const settings = await getSettings();
  
  if (settings.maintenanceMode) {
    // Skip maintenance page itself
    if (path === '/maintenance') {
      return null;
    }

    // Allow admin paths during maintenance
    if (maintenanceAllowedPaths.some(allowedPath => path.startsWith(allowedPath))) {
      return null;
    }
    
    // Allow API routes during maintenance ONLY for admin paths
    if (path.startsWith('/api/admin/')) {
      return null;
    }
    
    // Redirect everything else to maintenance page
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  // Check user registration setting
  if (!settings.userRegistration) {
    // Check if the current path is a sign-up related path
    const isSignUpPath = signUpPaths.some(signUpPath => {
      if (signUpPath.endsWith('(.*)')) {
        // Handle wildcard paths
        const basePath = signUpPath.replace('(.*)', '');
        return path.startsWith(basePath);
      }
      return path === signUpPath;
    });

    if (isSignUpPath) {
      // If registration is disabled, redirect to sign-in
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return null;
}

// Combine Clerk middleware with our custom middleware
export default clerkMiddleware((auth, request) => {
  return maintenanceMiddleware(request);
});

// Configure Middleware Matcher
export const config = {
  matcher: [
    "/((?!_next|images|api|trpc).*|/)",
    "/(api|trpc)(.*)",
  ]
};
