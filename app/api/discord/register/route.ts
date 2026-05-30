import { type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'

const COMMANDS = [
  {
    name: 'resultat',
    description: 'Enregistrer le résultat d\'un match — Héritier de la Brume',
  },
  {
    name: 'classement',
    description: 'Afficher le classement des Héritiers de la Brume',
  },
]

export async function GET(request: NextRequest) {
  const secret = new URL(request.url).searchParams.get('secret')
  const validSecret = secret && process.env.REGISTER_SECRET && secret === process.env.REGISTER_SECRET
  const isAdmin = await getAdminSession()

  if (!isAdmin && !validSecret) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const appId = process.env.DISCORD_APPLICATION_ID!
  const token = process.env.DISCORD_BOT_TOKEN!

  const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
    method: 'PUT',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(COMMANDS),
  })

  if (!res.ok) {
    return Response.json({ ok: false, error: await res.text() }, { status: 502 })
  }

  return Response.json({ ok: true, commands: await res.json() })
}
