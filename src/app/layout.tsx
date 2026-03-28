import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/app/ThemeRegistry";
import { portfolioApps } from "@/personal/data/resumeData";

export const metadata: Metadata = {
  description: portfolioApps.site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          src="https://cdn.jsdelivr.net/npm/pathseg@1.2.1/pathseg.js"
          async
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/build/decomp.min.js"
          async
        ></script>
      </head>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
