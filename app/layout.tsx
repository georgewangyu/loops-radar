import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://loopsradar.snackoverflowgeorge.com"),
  title: "Loops Radar",
  description:
    "A searchable catalog of reusable agent, research, content, coding, and operations loops.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Loops Radar",
    description:
      "A searchable catalog of reusable agent, research, content, coding, and operations loops.",
    url: "https://loopsradar.snackoverflowgeorge.com",
    type: "website",
  },
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
