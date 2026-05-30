'use client'

import { useState } from 'react'
import type { Heritier } from '@/lib/types'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'var(--color-deep)',
  border: '1px solid var(--color-mist)',
  borderRadius: '4px',
  color: 'var(--color-pearl)',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: 'var(--color-silver)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: '0.4rem',
}

export default function DuelRequestForm({ heritiers }: { heritiers: Heritier[] }) {
  const [demandeurNom, setDemandeurNom] = useState('')
  const [demandeurPseudo, setDemandeurPseudo] = useState('')
  const [cibleId, setCibleId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cible = heritiers.find(h => h.id === cibleId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!demandeurNom.trim()) { setError("Le nom de ton personnage est requis."); return }
    if (!demandeurPseudo.trim()) { setError("Ton pseudo Discord est requis."); return }
    if (!cible) { setError("Sélectionne un Héritier à défier."); return }

    setLoading(true)
    try {
      const res = await fetch('/api/duel-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandeur_nom: demandeurNom.trim(),
          demandeur_pseudo: demandeurPseudo.trim(),
          cible_nom: cible.nom_personnage,
          message: message.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Erreur lors de l\'envoi.')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--color-ice)', borderRadius: '8px', background: 'rgba(77,208,225,0.05)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚔️</div>
        <p style={{ fontFamily: 'var(--font-shippori), Georgia, serif', fontSize: '1.2rem', color: 'var(--color-ice)', marginBottom: '0.5rem' }}>
          Ton défi a été lancé dans la brume.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-silver)' }}>
          L&apos;Héritier sera notifié sur Discord. Prépare-toi.
        </p>
        <button
          onClick={() => { setSuccess(false); setDemandeurNom(''); setDemandeurPseudo(''); setCibleId(''); setMessage('') }}
          style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: 'transparent', border: '1px solid var(--color-mist)', borderRadius: '4px', color: 'var(--color-silver)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}
        >
          Lancer un autre défi
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={labelStyle}>Nom de ton personnage *</label>
        <input type="text" value={demandeurNom} onChange={e => setDemandeurNom(e.target.value)} placeholder="Ex : Ryū Hōzuki" style={inputStyle} required />
      </div>
      <div>
        <label style={labelStyle}>Pseudo Discord *</label>
        <input type="text" value={demandeurPseudo} onChange={e => setDemandeurPseudo(e.target.value)} placeholder="@ton_pseudo" style={inputStyle} required />
      </div>
      <div>
        <label style={labelStyle}>Héritier à défier *</label>
        <select value={cibleId} onChange={e => setCibleId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} required>
          <option value="">— Sélectionner un Héritier —</option>
          {heritiers.map(h => (
            <option key={h.id} value={h.id}>#{h.position} — {h.nom_personnage} ({h.rang})</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>
          Message de défi <span style={{ textTransform: 'none', opacity: 0.6 }}>(optionnel — max 300 car.)</span>
        </label>
        <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 300))} placeholder="Quelques mots pour marquer ton entrée dans la brume..." rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: message.length >= 280 ? '#f87171' : 'var(--color-silver)', marginTop: '0.25rem', opacity: 0.8 }}>
          {message.length}/300
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '4px', color: '#f87171', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} style={{
        padding: '0.875rem', background: 'rgba(77,208,225,0.12)', border: '1px solid var(--color-ice)', borderRadius: '4px',
        color: loading ? 'var(--color-silver)' : 'var(--color-ice)', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'inherit',
        letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      }}>
        {loading ? 'Envoi en cours…' : '⚔ Lancer le défi'}
      </button>
    </form>
  )
}
