import type { Metadata, Viewport } from "next";
// import { Geist } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";
import SessionProviderWrap from "@/components/shared/Providers/SessionProvider/SessionProvider";
import Footer from "@/components/HomePage/Footer/Footer";

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
  // this will render:
  // <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
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
        {" "}
        <SessionProviderWrap>
          {children}
          <Footer />
        </SessionProviderWrap>
      </body>
    </html>
  );
}
