import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { saveAllHeritiers } from '@/lib/db'
import type { Heritier } from '@/lib/types'

export async function POST(request: NextRequest) {
  if (!await getAdminSession()) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { heritiers } = await request.json() as { heritiers: Heritier[] }
    if (!Array.isArray(heritiers)) {
      return Response.json({ error: 'Données invalides' }, { status: 400 })
    }
    await saveAllHeritiers(heritiers)
    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}
