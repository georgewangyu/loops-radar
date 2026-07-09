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
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
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
