import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Natee Otakudesu API",
  description: "Otakudesu unofficial API, made by rizkyhaksono with 🤍",
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
