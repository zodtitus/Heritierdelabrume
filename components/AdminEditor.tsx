'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Heritier, Rang } from '@/lib/types'

const RANG_OPTIONS: Rang[] = ['Chūnin', 'Chūnin Confirmé']

const btn = (color: string, small?: boolean): React.CSSProperties => ({
  padding: small ? '0.25rem 0.6rem' : '0.4rem 0.9rem',
  border: `1px solid ${color}`,
  borderRadius: '4px',
  background: `${color}18`,
  color,
  cursor: 'pointer',
  fontSize: small ? '0.75rem' : '0.82rem',
  fontFamily: 'inherit',
  fontWeight: 600,
  whiteSpace: 'nowrap',
})

const inputSm: React.CSSProperties = {
  padding: '0.3rem 0.5rem',
  background: 'var(--color-deep)',
  border: '1px solid var(--color-mist)',
  borderRadius: '4px',
  color: 'var(--color-pearl)',
  fontSize: '0.82rem',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function AdminEditor({ initialData }: { initialData: Heritier[] }) {
  const router = useRouter()
  const [heritiers, setHeritiers] = useState<Heritier[]>(initialData)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newH, setNewH] = useState<Partial<Heritier>>({ rang: 'Chūnin', actif: true, wins: 0, losses: 0 })

  function update(id: string, field: keyof Heritier, value: unknown) {
    setHeritiers(hs => hs.map(h => h.id === id ? { ...h, [field]: value } : h))
  }

  function increment(id: string, field: 'wins' | 'losses') {
    setHeritiers(hs => hs.map(h => h.id === id ? { ...h, [field]: h[field] + 1 } : h))
  }

  function decrement(id: string, field: 'wins' | 'losses') {
    setHeritiers(hs => hs.map(h => h.id === id ? { ...h, [field]: Math.max(0, h[field] - 1) } : h))
  }

  function remove(id: string) {
    setHeritiers(hs => hs.filter(h => h.id !== id))
    setDeleteConfirm(null)
  }

  function addHeritier() {
    if (!newH.nom_personnage || !newH.pseudo_joueur) return
    const maxPos = heritiers.reduce((m, h) => Math.max(m, h.position), 0)
    setHeritiers(hs => [...hs, {
      id: newId(),
      nom_personnage: newH.nom_personnage!,
      pseudo_joueur: newH.pseudo_joueur!,
      rang: newH.rang ?? 'Chūnin',
      clan: newH.clan ?? null,
      titre: newH.titre ?? null,
      wins: newH.wins ?? 0,
      losses: newH.losses ?? 0,
      position: maxPos + 1,
      actif: true,
    }])
    setNewH({ rang: 'Chūnin', actif: true, wins: 0, losses: 0 })
    setShowAdd(false)
  }

  async function copyJson() {
    const sorted = [...heritiers].sort((a, b) => a.position - b.position)
    await navigator.clipboard.writeText(JSON.stringify(sorted, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const sorted = [...heritiers].sort((a, b) => a.position - b.position)

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-shippori), Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-pearl)', margin: 0 }}>
            Dashboard — Kiri
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)', marginTop: '0.25rem', opacity: 0.7 }}>
            Modifie le classement, puis exporte le JSON et colle-le sur GitHub.
          </p>
        </div>
        <button onClick={handleSignOut} style={btn('var(--color-silver)')}>Déconnexion</button>
      </div>

      {/* Workflow instructions */}
      <div style={{
        background: 'rgba(77,208,225,0.05)',
        border: '1px solid rgba(77,208,225,0.2)',
        borderRadius: '6px',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        fontSize: '0.82rem',
        color: 'var(--color-silver)',
        lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--color-ice)' }}>Workflow :</strong>{' '}
        1. Modifie les données ci-dessous &nbsp;→&nbsp;
        2. Clique <strong style={{ color: 'var(--color-ice)' }}>Copier le JSON</strong> &nbsp;→&nbsp;
        3. Va sur <strong>GitHub → data/heritiers.json → ✏️ Edit</strong> &nbsp;→&nbsp;
        4. Colle → Commit &nbsp;→&nbsp; Vercel redéploie en ~30 s.
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setShowAdd(!showAdd)} style={btn('var(--color-ice)')}>
          {showAdd ? '✕ Annuler' : '+ Ajouter un Héritier'}
        </button>
        <button onClick={copyJson} style={btn(copied ? '#4ade80' : 'var(--color-gold-mist)')}>
          {copied ? '✓ Copié !' : '📋 Copier le JSON'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: 'var(--color-deep)', border: '1px solid var(--color-mist)', borderRadius: '6px', padding: '1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Nom personnage *', field: 'nom_personnage', type: 'text' },
            { label: 'Pseudo joueur *', field: 'pseudo_joueur', type: 'text' },
            { label: 'Clan', field: 'clan', type: 'text' },
            { label: 'Titre honorifique', field: 'titre', type: 'text' },
          ].map(({ label, field }) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem' }}>{label}</label>
              <input
                type="text"
                value={(newH as Record<string, unknown>)[field] as string ?? ''}
                onChange={e => setNewH(n => ({ ...n, [field]: e.target.value || null }))}
                style={inputSm}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-silver)', marginBottom: '0.2rem' }}>Rang</label>
            <select value={newH.rang ?? 'Chūnin'} onChange={e => setNewH(n => ({ ...n, rang: e.target.value as Rang }))} style={{ ...inputSm, cursor: 'pointer' }}>
              {RANG_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={addHeritier} style={{ ...btn('var(--color-ice)'), width: '100%' }}>Ajouter</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-mist)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-mist)', background: 'var(--color-deep)' }}>
                {['Pos', 'Nom du personnage', 'Rang', 'Clan', 'Titre', 'Victoires', 'Défaites', 'Actif', ''].map(h => (
                  <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', color: 'var(--color-silver)', fontWeight: 500, whiteSpace: 'nowrap', fontSize: '0.78rem', letterSpacing: '0.03em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr key={h.id} style={{ borderBottom: '1px solid rgba(26,51,68,0.6)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <input
                      type="number"
                      value={h.position}
                      onChange={e => update(h.id, 'position', parseInt(e.target.value) || 1)}
                      style={{ ...inputSm, width: '55px' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ color: 'var(--color-pearl)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h.nom_personnage}</div>
                    <div style={{ color: 'var(--color-silver)', fontSize: '0.75rem', opacity: 0.7 }}>{h.pseudo_joueur}</div>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <select value={h.rang} onChange={e => update(h.id, 'rang', e.target.value)} style={{ ...inputSm, fontSize: '0.78rem' }}>
                      {RANG_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-silver)', fontSize: '0.8rem' }}>{h.clan ?? '—'}</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-gold-mist)', fontSize: '0.8rem', fontStyle: 'italic', maxWidth: '150px' }}>
                    {h.titre ? `« ${h.titre} »` : '—'}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => decrement(h.id, 'wins')} style={btn('#4ade80', true)}>−</button>
                      <span style={{ color: '#4ade80', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{h.wins}</span>
                      <button onClick={() => increment(h.id, 'wins')} style={btn('#4ade80', true)}>+</button>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => decrement(h.id, 'losses')} style={btn('#f87171', true)}>−</button>
                      <span style={{ color: '#f87171', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{h.losses}</span>
                      <button onClick={() => increment(h.id, 'losses')} style={btn('#f87171', true)}>+</button>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <button onClick={() => update(h.id, 'actif', !h.actif)} style={btn(h.actif ? '#4ade80' : 'var(--color-silver)', true)}>
                      {h.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    {deleteConfirm === h.id ? (
                      <span style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={() => remove(h.id)} style={btn('#f87171', true)}>Oui</button>
                        <button onClick={() => setDeleteConfirm(null)} style={btn('var(--color-silver)', true)}>Non</button>
                      </span>
                    ) : (
                      <button onClick={() => setDeleteConfirm(h.id)} style={btn('#f87171', true)}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export reminder */}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button onClick={copyJson} style={btn(copied ? '#4ade80' : 'var(--color-gold-mist)')}>
          {copied ? '✓ JSON copié dans le presse-papier !' : '📋 Copier le JSON mis à jour'}
        </button>
      </div>

      <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-silver)', opacity: 0.5, marginTop: '0.5rem' }}>
        Les modifications sont en mémoire uniquement. Colle le JSON sur GitHub pour les publier.
      </p>
    </div>
  )
}
