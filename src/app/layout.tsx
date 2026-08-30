import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "One Minute Game",
  description:
    "Press a button. Get a game. No prompts — AI builds a playable game in 1, 2, or 3 minutes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#0b0b1a",
          minHeight: "100dvh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
