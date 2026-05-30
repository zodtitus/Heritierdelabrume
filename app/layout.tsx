import type { Metadata } from 'next'
import { Shippori_Mincho, DM_Sans } from 'next/font/google'
import './globals.css'
import MistBackground from '@/components/MistBackground'
import NavBar from '@/components/NavBar'

const shipporiMincho = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-shippori',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Héritier de la Brume — Kirigakure',
  description: 'Tournoi officiel du village de Kirigakure — Classement des Héritiers de la Brume',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${shipporiMincho.variable} ${dmSans.variable}`}>
      <body className="relative min-h-screen" style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}>
        <MistBackground />
        <NavBar />
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  )
}
