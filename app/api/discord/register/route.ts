import { getAdminSession } from '@/lib/auth'

const COMMANDS = [
  {
    name: 'resultat',
    description: 'Enregistrer le résultat d\'un match — Héritier de la Brume',
    options: [
      {
        name: 'gagnant',
        description: 'Nom du personnage gagnant (ex: Ao Ren Yokushin)',
        type: 3,
        required: true,
      },
      {
        name: 'perdant',
        description: 'Nom du personnage perdant (ex: Tengetsu Hōzuki)',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'classement',
    description: 'Afficher le classement actuel des Héritiers de la Brume',
  },
]

export async function GET() {
  if (!await getAdminSession()) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const appId = process.env.DISCORD_APPLICATION_ID!
  const token = process.env.DISCORD_BOT_TOKEN!

  const res = await fetch(
    `https://discord.com/api/v10/applications/${appId}/commands`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(COMMANDS),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return Response.json({ ok: false, error: err }, { status: 502 })
  }

  const data = await res.json()
  return Response.json({ ok: true, commands: data })
}
