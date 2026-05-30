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
  const { searchParams } = new URL(request.url)
  const secret  = searchParams.get('secret')
  const guildId = searchParams.get('guildId')

  const validSecret = secret && process.env.REGISTER_SECRET && secret === process.env.REGISTER_SECRET
  const isAdmin = await getAdminSession()
  if (!isAdmin && !validSecret) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const appId = process.env.DISCORD_APPLICATION_ID!
  const token  = process.env.DISCORD_BOT_TOKEN!

  // Commandes de serveur (instant) ou globales (jusqu'à 1h)
  const url = guildId
    ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${appId}/commands`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(COMMANDS),
  })

  const data = await res.json()
  if (!res.ok) return Response.json({ ok: false, error: data }, { status: 502 })

  return Response.json({
    ok: true,
    mode: guildId ? `serveur (${guildId})` : 'global',
    commands: data,
  })
}
