import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const siteUrl = "https://traderkit.xyz";
const title = "TraderKit — Crypto Trading Platform: P&L, Journal & Tax";
const description =
  "The trading platform for crypto. Real P&L, a journal that makes you a better trader, and EU tax reports — auto-imported from Kraken, Binance, and Coinbase.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "crypto trading platform",
    "crypto trading journal",
    "crypto P&L tracker",
    "crypto tax reports",
    "FIFO cost basis",
    "EU crypto tax",
    "Kraken trading journal",
    "crypto journal app",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "TraderKit",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          precedence="default"
        />
        <script defer src="https://analytics.juliendsv.com/script.js" data-website-id="44730054-86f8-4277-9dd2-9a100d38aebd" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
