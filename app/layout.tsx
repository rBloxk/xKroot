import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Providers } from '@/components/Providers'

const lexend = Lexend({ 
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-lexend',
})

export const metadata: Metadata = {
  title: 'xkroot',
  description: 'xkroot company website',
  icons: {
    icon: '/images/xkroot-white-transparent.png',
    shortcut: '/images/xkroot-white-transparent.png',
    apple: '/images/xkroot-white-transparent.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={lexend.variable}>
        <Providers>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

