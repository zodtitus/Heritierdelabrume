'use client'

export default function MistBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(77,208,225,0.07) 0%, transparent 70%)',
        animation: 'mistFloat1 18s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(13,26,36,0.9) 0%, rgba(77,208,225,0.04) 50%, transparent 80%)',
        animation: 'mistFloat2 24s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 80%, rgba(26,51,68,0.5) 0%, rgba(77,208,225,0.06) 60%, transparent 100%)',
        animation: 'mistFloat3 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 90% 40% at 10% 90%, rgba(77,208,225,0.05) 0%, transparent 60%)',
        animation: 'mistFloat4 28s ease-in-out infinite',
      }} />
    </div>
  )
}
