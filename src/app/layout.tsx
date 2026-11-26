import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-script";
import { Providers } from "./providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [{ color: "#f3f6f4" }],
};

export const metadata: Metadata = {
  title: "Aivora Admin",
  description: "Admin console for Aivora",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/aivora-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/aivora-mark.svg" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint (no flash). Static string, no user input. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
