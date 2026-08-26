import type { Metadata } from "next";
import { Inter, Outfit, Russo_One } from "next/font/google";
import Script from "next/script";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("qstakebet-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const russo = Russo_One({ weight: "400", subsets: ["latin"], variable: "--font-russo" });

export const metadata: Metadata = {
  title: "QSTAKEbet - NSMQ Fantasy Platform",
  description: "Free NSMQ fantasy game - draft your school squad, earn points every matchday and climb the leaderboard",
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
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased pb-16 lg:pb-0",
          inter.variable,
          outfit.variable,
          russo.variable
        )}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ClientLayout>{children}</ClientLayout>
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
