import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });



export const metadata: Metadata = {
  title: "Gabriel Goldstein Portfolio",
  description: "Gabriel Goldstein's portfolio containing his projects, work experience, et cetera. Created using Next.Js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
