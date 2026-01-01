import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Updated fonts based on previous tasks
import { cn } from "@/lib/utils";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "QSTAKEbet - NSMQ Prediction Platform",
  description: "Advanced betting platform for the National Science & Maths Quiz",
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
          outfit.variable
        )}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
