import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mała niespodzianka · Tylko dla Ciebie",
  description: "Niektóre niespodzianki zaczynają się od małego listu. Otwórz swój.",
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
