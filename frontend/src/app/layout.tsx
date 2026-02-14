import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "DataPilot",
  description: "Business Intelligence with conversational AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-gray-950 text-gray-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
