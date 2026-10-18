import type { Metadata } from "next";
import "./globals.css";
import "./desk.css";
import "./three.css";

export const metadata: Metadata = {
  title: "Benchmate — Your PC workbench",
  description: "Troubleshoot your PC, plan a budget build, and follow a step-by-step assembly guide with Benchmate.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
