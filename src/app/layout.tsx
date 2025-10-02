import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import prisma from "@/lib/prisma";
import { ChatProvider } from "@/components/providers/ChatProvider";
import { FloatingChatContainer } from "@/components/chat/FloatingChatContainer";


type Setting = {
  key: string;
  value: string;
};

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
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['siteName', 'siteDescription', 'metaKeywords', 'metaDescription', 'siteFavicon']
        }
      }
    });

    const settingsMap = settings.reduce((acc: { [key: string]: string }, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return {
      title: settingsMap.siteName || 'Socially',
      description: settingsMap.metaDescription || 'A modern social media application powered by Next.js',
      keywords: settingsMap.metaKeywords,
      icons: settingsMap.siteFavicon ? [
        {
          rel: 'icon',
          url: settingsMap.siteFavicon
        }
      ] : undefined
    };
  } catch (error) {
    console.error('Error fetching metadata settings:', error);
    return {
      title: 'Socially',
      description: 'A modern social media application powered by Next.js'
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
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
            <Toaster />
            <ChatProvider />
            <FloatingChatContainer />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}