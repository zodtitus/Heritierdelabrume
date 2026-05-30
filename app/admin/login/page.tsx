'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (!res.ok) {
      setError('Mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-mist)',
        borderRadius: '8px',
        padding: '2.5rem',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-shippori), Georgia, serif',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--color-pearl)',
          marginBottom: '0.25rem',
          textAlign: 'center',
        }}>
          Administration
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-silver)', textAlign: 'center', marginBottom: '2rem', opacity: 0.7 }}>
          Kirigakure — Accès restreint
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-silver)', marginBottom: '0.4rem' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: '4px',
              color: '#f87171',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '0.875rem',
            background: 'rgba(77,208,225,0.12)',
            border: '1px solid var(--color-ice)',
            borderRadius: '4px',
            color: 'var(--color-ice)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            marginTop: '0.5rem',
          }}>
            {loading ? 'Connexion…' : 'Entrer dans la brume'}
          </button>
        </form>
      </div>
    </div>
  )
}
