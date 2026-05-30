interface RankBadgeProps {
  position: number
}

const medals = ['①', '②', '③']
const labels = ['I', 'II', 'III']

export default function RankBadge({ position }: RankBadgeProps) {
  if (position > 3) return null

  return (
    <div style={{
      position: 'absolute',
      top: '-10px',
      left: '-10px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #c9a96e 0%, #b8a07a 50%, #8a6c3a 100%)',
      border: '1px solid var(--color-gold-mist)',
      boxShadow: '0 0 12px rgba(184,160,122,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-shippori), Georgia, serif',
      fontSize: '0.875rem',
      fontWeight: 700,
      color: '#1a0f00',
      zIndex: 2,
    }}>
      {labels[position - 1]}
    </div>
  )
}
