import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getWebsiteTitle, getWebsiteDescription, isNightModeDefault, canUsersChangeMode, getCustomWallpaper, isDefaultWallpaper } from "@/lib/app-settings";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import WebsiteLiveCheck from "@/components/WebsiteLiveCheck";
import WebsiteMetadata from "@/components/WebsiteMetadata";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getWebsiteTitle();
  const siteDescription = await getWebsiteDescription();
  
  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`
    },
    description: siteDescription,
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [defaultDark, allowUserChange, customWallpaper, useDefaultWallpaper] = await Promise.all([
    isNightModeDefault(),
    canUsersChangeMode(),
    getCustomWallpaper(),
    isDefaultWallpaper()
  ]);
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <WebsiteMetadata />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={!useDefaultWallpaper && customWallpaper ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat' } : undefined}>
          <ThemeProvider
            attribute="class"
            defaultTheme={defaultDark ? "dark" : "light"}
            enableSystem={false}
            disableTransitionOnChange
          >
            <WebsiteLiveCheck>
              <div className="min-h-screen">
                <Navbar />

                <main className="py-8">
                  {/* container to center the content */}
                  <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="hidden lg:block lg:col-span-3">
                        <Sidebar />
                      </div>
                      <div className="lg:col-span-9">{children}</div>
                    </div>
                  </div>
                </main>
              </div>
            </WebsiteLiveCheck>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}