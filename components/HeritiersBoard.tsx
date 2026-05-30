import type { Heritier } from '@/lib/types'
import HeirCard from './HeirCard'

interface HeiritiersBoardProps {
  heritiers: Heritier[]
}

export default function HeritiersBoard({ heritiers }: HeiritiersBoardProps) {
  if (heritiers.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem 0',
        color: 'var(--color-silver)',
        fontStyle: 'italic',
      }}>
        Aucun Héritier de la Brume pour l&apos;instant.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {heritiers.map((h, i) => (
        <HeirCard key={h.id} heritier={h} index={i} />
      ))}
    </div>
  )
}
