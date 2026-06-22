import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loops Radar",
  description:
    "A searchable catalog of reusable agent, research, content, coding, and operations loops.",
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
