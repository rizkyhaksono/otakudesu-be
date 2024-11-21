"use client";

// IMPORTANT: nextui doesn't support react 19 yet, so i'm not using it
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import Header from "./Header";
import Footer from "./Footer";

export default function BaseLayout({ children }: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <Header />
        <div className="dark text-foreground bg-background">
          {children}
        </div>
        <Footer />
      </NextThemesProvider>
    </NextUIProvider>
  );
}
