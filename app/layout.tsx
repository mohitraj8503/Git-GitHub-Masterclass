import type { Metadata } from "next";
import { Anton, Plus_Jakarta_Sans, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import WebflowClasses from "@/components/WebflowClasses";
import SiteInteractions from "@/components/SiteInteractions";
import AuthProvider from "@/components/AuthProvider";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://github-masterclass.azurewebsites.net'),
  title: "Git & GitHub Masterclass — 7-Day Hands-On Workshop",
  description:
    "A 7-day hands-on Git & GitHub workshop organized by the Microsoft Learn Student Ambassador program at Arka Jain University.",
  openGraph: {
    title: "Git & GitHub Masterclass — 7-Day Hands-On Workshop",
    description:
      "A 7-day hands-on Git & GitHub workshop organized by the Microsoft Learn Student Ambassador program at Arka Jain University.",
    images: ["/images/opengaph-20-20home.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Git & GitHub Masterclass — 7-Day Hands-On Workshop",
    description:
      "A 7-day hands-on Git & GitHub workshop organized by the Microsoft Learn Student Ambassador program at Arka Jain University.",
    images: ["/images/opengaph-20-20home.png"],
  },
  icons: {
    icon: "/images/favicon.png",
    apple: "/images/app-icon.png",
  },
  generator: "Webflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      data-wf-page="664af7bf6430c50e0ebf6c48"
      data-wf-site="664af7bf6430c50e0ebf6c3f"
      lang="en"
      className={`w-mod-js ${anton.variable} ${plusJakartaSans.variable} ${barlowCondensed.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://assets-global.website-files.com" rel="preconnect" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

      </head>
      <body>
        <AuthProvider>
          <WebflowClasses />
          {children}
          <SiteInteractions />
        </AuthProvider>
      </body>
    </html>
  );
}
