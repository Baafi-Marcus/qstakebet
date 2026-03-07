import type { Metadata } from "next";
import { Inter, Outfit, Russo_One } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";
import { SplashScreen } from "@/components/ui/SplashScreen";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const russo = Russo_One({ weight: "400", subsets: ["latin"], variable: "--font-russo" });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qstakebet.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "QSTAKEbet | NSMQ Betting Excellence",
    template: "%s | QSTAKEbet"
  },
  description: "Experience the thrill of the National Science & Maths Quiz with QSTAKEbet. Secure, fast, and competitive odds on your favorite schools.",
  manifest: "/manifest.json",
  keywords: ["NSMQ", "Betting", "Ghana", "Quiz", "Science", "Maths", "QSTAKEbet", "Virtual Sports"],
  authors: [{ name: "QSTAKEbet Team" }],
  creator: "QSTAKEbet",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: baseUrl,
    siteName: "QSTAKEbet",
    title: "QSTAKEbet | National Science & Maths Quiz Betting",
    description: "Bet on your favorite schools in the National Science & Maths Quiz. Pure adrenaline, competitive odds.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QSTAKEbet Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QSTAKEbet | NSMQ Betting Platform",
    description: "The ultimate platform for National Science & Maths Quiz fans. Win big with your school!",
    images: ["/twitter-image.png"],
    creator: "@qstakebet",
  },
  alternates: {
    canonical: "/",
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
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased pb-16 lg:pb-0",
          inter.variable,
          outfit.variable,
          russo.variable
        )}
      >
        <MaintenanceGuard>
          <ClientLayout>{children}</ClientLayout>
        </MaintenanceGuard>
      </body>
    </html>
  );
}
