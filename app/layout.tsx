import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rintara | Kesempatan menjadi Bukti Kerja",
    template: "%s · Rintara",
  },
  description:
    "Temukan kesempatan kerja lokal yang jelas, bangun Bukti Kerja, dan kembangkan Paspor Rintara.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={figtree.variable}>
      <body>{children}</body>
    </html>
  );
}
