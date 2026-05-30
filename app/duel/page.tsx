import { getActiveHeritiers } from '@/lib/db'
import DuelRequestForm from '@/components/DuelRequestForm'
import type { Heritier } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DuelPage() {
  const heritiers = (await getActiveHeritiers()).filter(h => !h.vacant) as Heritier[]

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-shippori), Georgia, serif',
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 700,
          color: 'var(--color-pearl)',
          margin: 0,
          letterSpacing: '0.04em',
        }}>
          Lancer un défi
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-silver)', marginTop: '0.75rem', lineHeight: 1.6 }}>
          Tu souhaites affronter un Héritier de la Brume ?<br />
          Soumets ton défi. Il sera transmis directement dans la brume de Kiri.
        </p>
        <div style={{
          width: '40px', height: '1px',
          background: 'linear-gradient(to right, transparent, var(--color-ice), transparent)',
          margin: '1.5rem auto 0',
        }} />
      </div>

      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-mist)',
        borderRadius: '8px',
        padding: '2rem',
      }}>
        <DuelRequestForm heritiers={heritiers} />
      </div>
    </div>
  )
}
