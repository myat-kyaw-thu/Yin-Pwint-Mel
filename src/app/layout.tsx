// app/layout.tsx
import { ReactNode } from "react";
import AuthProvider from "./auth-provider";
import ClientOnlyWrapper from "./ClientOnlyWrapper";
import "./globals.css";

export const metadata = {
  title: "My Next.js App",
  description: "An awesome Next.js app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>{/* You can include meta tags, external styles, etc. here */}</head>
      <body>
        <ClientOnlyWrapper>
          <div>
            <AuthProvider>{children}</AuthProvider>
          </div>
        </ClientOnlyWrapper>
      </body>
    </html>
  );
}
