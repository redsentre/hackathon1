import type { Metadata } from "next";
import { Montserrat, Inconsolata } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const display = Montserrat({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-display",
  display: "swap",
});

const body = Inconsolata({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArthSaathi - Finance explained in the language of the people",
  description: "Translate complex financial jargon into plain, actionable language — instantly, privately, and trustlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#151617',
              color: '#F8ECE4',
              border: '1px solid #BAB6AA',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#151617',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#151617',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
