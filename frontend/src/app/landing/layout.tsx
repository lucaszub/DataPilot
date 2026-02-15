import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Snowflake - La Data Cloud",
  description: "Snowflake landing page clone",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
