import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Master Control Panel",
  description: "Central admin for client ecommerce sites",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
