import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thekedaar — Find kaam. Post naukri.",
  description:
    "Blue-collar jobs on WhatsApp and the web. Browse open roles without signing in. Workers find work; employers post jobs.",
  icons: {
    icon: [{ url: "/logo-icon.png", type: "image/png" }],
    apple: [{ url: "/logo-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-hidden">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
