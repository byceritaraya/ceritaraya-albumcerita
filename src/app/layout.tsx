import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import { cookies } from "next/headers";
import { I18nProvider, type Lang } from "@/lib/i18n/context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlbumCerita",
  description: "Capture and share beautiful moments from every celebration.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the language preference from the server cookie so initial render matches.
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("ac_lang")?.value;
  const initialLang: Lang =
    langCookie === "en" || langCookie === "id" ? langCookie : "id";

  return (
    <html lang={initialLang}>
      <body
        className={`${inter.variable} ${playfair.variable} ${cormorant.variable} antialiased`}
      >
        <I18nProvider initialLang={initialLang}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
