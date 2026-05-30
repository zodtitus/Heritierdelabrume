'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Classement' },
    { href: '/duel', label: 'Lancer un défi' },
  ]

  return (
    <nav style={{
      position: 'relative',
      zIndex: 20,
      borderBottom: '1px solid var(--color-mist)',
      background: 'rgba(8,12,16,0.85)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-shippori), Georgia, serif',
            fontSize: '1.1rem',
            color: 'var(--color-ice)',
            letterSpacing: '0.05em',
            fontWeight: 600,
          }}>
            霧の継承者
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                letterSpacing: '0.03em',
                color: pathname === href ? 'var(--color-ice)' : 'var(--color-silver)',
                borderBottom: pathname === href ? '1px solid var(--color-ice)' : '1px solid transparent',
                paddingBottom: '2px',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/admin"
            style={{
              textDecoration: 'none',
              fontSize: '0.75rem',
              color: 'var(--color-silver)',
              opacity: 0.5,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
