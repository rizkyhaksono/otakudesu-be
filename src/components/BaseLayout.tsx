"use client";

import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import Header from "./Header";
import Footer from "./Footer";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <Header />
        <div className="dark text-foreground bg-background">{children}</div>
        <Footer />
      </NextThemesProvider>
    </NextUIProvider>
  );
}
