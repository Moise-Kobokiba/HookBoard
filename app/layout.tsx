import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hookboard — Build. Trigger. Inspect.',
  description: 'A visual playground for APIs and webhooks.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
