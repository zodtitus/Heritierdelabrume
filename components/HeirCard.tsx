'use client'

import { motion } from 'framer-motion'
import type { Heritier } from '@/lib/types'
import RankBadge from './RankBadge'

interface HeirCardProps {
  heritier: Heritier
  index: number
}

export default function HeirCard({ heritier, index }: HeirCardProps) {
  const isTop3 = (heritier.position ?? 99) <= 3
  const pos = heritier.position ?? index + 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      style={{
        position: 'relative',
        background: 'var(--color-surface)',
        border: `1px solid ${isTop3 ? 'var(--color-gold-mist)' : 'var(--color-mist)'}`,
        borderRadius: '8px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        cursor: 'default',
        transition: 'box-shadow 0.25s, border-color 0.25s',
        boxShadow: isTop3
          ? '0 0 20px rgba(184,160,122,0.15)'
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = isTop3
          ? '0 0 28px rgba(184,160,122,0.3), 0 0 12px rgba(77,208,225,0.15)'
          : '0 0 20px rgba(77,208,225,0.2), 0 4px 16px rgba(0,0,0,0.4)'
        el.style.borderColor = isTop3 ? 'var(--color-gold-mist)' : 'var(--color-ice)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = isTop3
          ? '0 0 20px rgba(184,160,122,0.15)'
          : '0 2px 8px rgba(0,0,0,0.3)'
        el.style.borderColor = isTop3 ? 'var(--color-gold-mist)' : 'var(--color-mist)'
      }}
    >
      {isTop3 && <RankBadge position={pos} />}

      {/* Position number */}
      <div style={{
        minWidth: '2.5rem',
        textAlign: 'center',
        fontFamily: 'var(--font-shippori), Georgia, serif',
        fontSize: '1.5rem',
        fontWeight: 700,
        color: isTop3 ? 'var(--color-gold-mist)' : 'var(--color-mist)',
        lineHeight: 1,
      }}>
        {pos}
      </div>

      {/* Separator */}
      <div style={{
        width: '1px',
        height: '48px',
        background: isTop3
          ? 'linear-gradient(to bottom, transparent, var(--color-gold-mist), transparent)'
          : 'linear-gradient(to bottom, transparent, var(--color-mist), transparent)',
        flexShrink: 0,
      }} />

      {/* Info principale */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-shippori), Georgia, serif',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--color-pearl)',
            whiteSpace: 'nowrap',
          }}>
            {heritier.nom_personnage}
          </span>
          {heritier.clan && (
            <span style={{
              fontSize: '0.8rem',
              fontStyle: 'italic',
              color: 'var(--color-silver)',
            }}>
              Clan {heritier.clan}
            </span>
          )}
        </div>

        {heritier.titre && (
          <div style={{ marginTop: '0.4rem' }}>
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--color-gold-mist)',
              fontStyle: 'italic',
            }}>
              « {heritier.titre} »
            </span>
          </div>
        )}
      </div>

      {/* Bilan */}
      <div style={{
        textAlign: 'right',
        flexShrink: 0,
        fontFamily: 'var(--font-shippori), Georgia, serif',
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '2px' }}>
          Bilan
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700 }}>
          <span style={{ color: '#4ade80' }}>V{heritier.wins}</span>
          <span style={{ color: 'var(--color-mist)', margin: '0 4px' }}>·</span>
          <span style={{ color: '#f87171' }}>D{heritier.losses}</span>
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--color-silver)',
          marginTop: '2px',
          opacity: 0.7,
        }}>
          {heritier.pseudo_joueur}
        </div>
      </div>
    </motion.div>
  )
}
