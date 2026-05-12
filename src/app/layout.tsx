import type { Metadata, Viewport } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import SessionProviderWrap from "@/components/shared/Providers/SessionProvider/SessionProvider";
import Footer from "@/components/HomePage/Footer/Footer";
import PlausibleProvider from "next-plausible";
import TopLoadingBar from "@/components/shared/TopLoadingBar/TopLoadingBar";

const RobotoFlex = localFont({
  src: "../../public/fonts/RobotoFlex.woff2",
  variable: "--RobotoFlex",
  display: "swap",
});

const RobotoFlexii = localFont({
  src: "../../public/fonts/RobotoFlexii.woff2",
  variable: "--RobotoFlexii",
  display: "swap",
});

const RobotoCondensed = localFont({
  src: "../../public/fonts/RobotoCondensed.woff2",
  variable: "--RobotoCondensed",
  display: "swap",
});

const Roboto = localFont({
  src: "../../public/fonts/Roboto.woff2",
  variable: "--Roboto",
  display: "swap",
});

const GeistMono = localFont({
  src: "../../public/fonts/GeistMono.woff2",
  variable: "--GeistMono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Fonts & Footers | Custom Booking Websites",
    template: "%s - Fonts & Footers",
  },
  description:
    "Fonts & Footers builds lightning-fast, mobile-first booking platforms that cut no-shows, and automate deposits for salons, spas, rentals, and service brands.",
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${RobotoFlex.variable} ${RobotoFlexii.variable} ${RobotoCondensed.variable} ${Roboto.variable} ${GeistMono.variable}`}
      >
        <TopLoadingBar />
        <PlausibleProvider
          domain='fontsandfooters.com'
          trackLocalhost={false}
          enabled={true}
        >
          <SessionProviderWrap>
            {children}
            <Footer />
            <Toaster
              position='top-right'
              toastOptions={{
                duration: 4000,
                style: {
                  fontFamily: "var(--GeistMono)",
                  fontSize: "1.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "2rem",
                  borderRadius: "0",
                  background: "#0a0a0a",
                  color: "#fff",
                  border: "1px solid #1a1a1a",
                  maxWidth: "50rem",
                },
                success: {
                  iconTheme: {
                    primary: "#fbbf24",
                    secondary: "#000",
                  },
                },
                error: {
                  duration: 6000,
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </SessionProviderWrap>
        </PlausibleProvider>
      </body>
    </html>
  );
}
