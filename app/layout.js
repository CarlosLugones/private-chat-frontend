import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import 'animate.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] });

const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
const coverImageUrl = frontendUrl + '/opengraph-image.png';

export const metadata = {
  title: 'Private Chat',
  description: 'A secure, ephemeral chat application with no history, logs, tracking, or authentication.',
  openGraph: {
    title: 'Private Chat',
    description: 'A secure, ephemeral chat application with no history, logs, tracking, or authentication.',
    images: [
      {
        url: coverImageUrl,
        width: 1600,
        height: 900,
        alt: 'Private Chat',
      }
    ],
    url: frontendUrl,
    siteName: 'Private Chat',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Private Chat',
    description: 'A secure, ephemeral chat application with no history, logs, tracking, or authentication.',
    images: [coverImageUrl],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
