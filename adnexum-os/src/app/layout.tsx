import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Adnexum OS — Sales Operating System",
  description: "CRM + Pipeline + KPIs + Tasks — Tu sistema operativo de ventas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Providers>
            <Sidebar />
            <main
              style={{
                flex: 1,
                marginLeft: '256px',
                padding: '24px',
                transition: 'margin-left 0.3s',
                minHeight: '100vh',
              }}
            >
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
