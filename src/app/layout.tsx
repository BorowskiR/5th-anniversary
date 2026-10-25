import type { Metadata } from "next";
import "./globals.css";

const deploymentUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const title = "Mała niespodzianka · Tylko dla Ciebie";
const description =
  "Niektóre niespodzianki zaczynają się od małego listu. Otwórz swój.";

export const metadata: Metadata = {
  metadataBase: new URL(
    deploymentUrl ? `https://${deploymentUrl}` : "http://localhost:3000",
  ),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "pl_PL",
    url: "/",
    images: [
      {
        url: "/gallery/5th-anniversary/background.jpeg",
        width: 2048,
        height: 1152,
        type: "image/jpeg",
        alt: title,
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
