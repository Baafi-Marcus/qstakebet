import type { Metadata } from "next";
import { Inter, Outfit, Russo_One } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { SplashScreen } from "@/components/ui/SplashScreen";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const russo = Russo_One({ weight: "400", subsets: ["latin"], variable: "--font-russo" });

export const metadata: Metadata = {
  title: "QSTAKEbet - NSMQ Prediction Platform",
  description: "Advanced betting platform for the National Science & Maths Quiz",
  manifest: "/manifest.json",
  themeColor: "#0f1115",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QSTAKEbet",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased pb-16 lg:pb-0",
          inter.variable,
          outfit.variable,
          russo.variable
        )}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
