import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ScapeAir - AI-Powered Landscape Design',
  description: 'Create stunning 3D landscape and hardscape designs with AI-powered visualization for client presentations.',
  keywords: ['landscape design', 'hardscape', 'AI design', '3D visualization', 'landscaping'],
  authors: [{ name: 'ScapeAir Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-secondary-50`}>
        {children}
      </body>
    </html>
  )
} 