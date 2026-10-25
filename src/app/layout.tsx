import type { Metadata } from "next";
import "./globals.css";

const deploymentUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const metadata: Metadata = {
  metadataBase: new URL(
    deploymentUrl ? `https://${deploymentUrl}` : "http://localhost:3000",
  ),
  title: "Mała niespodzianka · Tylko dla Ciebie",
  description: "Niektóre niespodzianki zaczynają się od małego listu. Otwórz swój.",
  openGraph: {
    images: [
      {
        url: "/gallery/5th-anniversary/background.jpeg",
        alt: "Mała niespodzianka · Tylko dla Ciebie",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
