import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Barlow } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-racing",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
});

const barlow = Barlow({
  variable: "--font-hud",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "JDM Racer Map",
  description: "Telegram Mini App – JDM community racer map",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#060608",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${barlowCondensed.variable} ${barlow.variable} h-full`}
    >
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
