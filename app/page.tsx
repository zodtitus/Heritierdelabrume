import Link from 'next/link'
import { getActiveHeritiers } from '@/lib/db'
import HeritiersBoard from '@/components/HeritiersBoard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const heritiers = await getActiveHeritiers()

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-shippori), Georgia, serif',
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 700,
          color: 'var(--color-ice)',
          letterSpacing: '0.08em',
          margin: 0,
          lineHeight: 1.1,
        }}>
          Héritiers de la Brume
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-silver)', marginTop: '0.75rem', letterSpacing: '0.05em' }}>
          Tournoi officiel de Kirigakure
        </p>
        <div style={{
          width: '60px', height: '1px',
          background: 'linear-gradient(to right, transparent, var(--color-ice), transparent)',
          margin: '1.5rem auto 0',
        }} />
      </div>

      <HeritiersBoard heritiers={heritiers} />

      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-silver)', marginBottom: '1rem' }}>
          Penses-tu pouvoir défier un Héritier de la Brume ?
        </p>
        <Link href="/duel" style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: 'transparent',
          border: '1px solid var(--color-ice)',
          borderRadius: '4px',
          color: 'var(--color-ice)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: 500,
          letterSpacing: '0.06em',
        }}>
          ⚔ Lancer un défi
        </Link>
      </div>
    </div>
  )
}
