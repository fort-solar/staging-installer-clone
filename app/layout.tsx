import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Script from "next/script";
import { SidebarInitializer } from "@/util/SidebarInitializer";
import { AuthProvider } from "@/components/auth/auth-provider";
import { getSessionSnapshotFromCookieStore } from "@/lib/auth/session";
import { env } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://installer.fortsolar.ng"),

  title: {
    default: "Fortsolar Installer Portal | Jobs, Projects & Payouts",
    template: "%s | Fortsolar",
  },

  description:
    "Fortsolar installer workspace for onboarding, project delivery, job tracking, and payout management.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Fortsolar Installer Portal | Jobs, Projects & Payouts",
    description:
      "Installer onboarding, active jobs, project updates, and payout visibility in one Fortsolar portal.",
    type: "website",
    siteName: "Fortsolar Installer Portal",
    images: [
      {
        url: "/FortsolarLogo.png",
        width: 1200,
        height: 630,
        alt: "Fortsolar Installer Portal | Jobs, Projects & Payouts",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Fortsolar Installer Portal | Jobs, Projects & Payouts",
    description:
      "Fortsolar installer access for jobs, projects, and payouts.",
  },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Fortsolar Installer Portal",
  url: "https://installer.fortsolar.ng",
  logo: "https://www.fortsolar.ng/FortsolarLogo.png",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSession = await getSessionSnapshotFromCookieStore(await cookies());
  const appId = env.oneSignalAppId;
  const googleClientId = env.googleClientId;
  const authTree = (
    <AuthProvider initialSession={initialSession} portal="installer">
      {children}
    </AuthProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.classList.toggle('dark',localStorage.getItem('fortsolar:appearance')==='dark')}catch(e){}` }} /></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="ld-org"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        {appId ? (
          <Script
            src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
            strategy="afterInteractive"
          />
        ) : null}
        <SidebarInitializer />
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {authTree}
          </GoogleOAuthProvider>
        ) : (
          authTree
        )}
      </body>
    </html>
  );
}
