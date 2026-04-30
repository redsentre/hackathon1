import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
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
      <body className="min-h-full flex flex-col bg-navy text-white font-body">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0D2646',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#0D2646',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#0D2646',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
