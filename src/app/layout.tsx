import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "TuneGO Management Portal",
  description: "Management portal for Fango point system and live events",
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
