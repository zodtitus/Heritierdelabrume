import { NextRequest } from 'next/server'
import { createVerify } from 'node:crypto'
import { readHeritiers, writeHeritiers, findHeritier } from '@/lib/github'

// Types Discord minimaux
interface DiscordInteraction {
  type: number
  data?: {
    name: string
    options?: { name: string; value: string }[]
  }
  member?: { user: { username: string } }
  user?: { username: string }
}

function verifyDiscordSignature(publicKey: string, signature: string, timestamp: string, body: string): boolean {
  try {
    return createVerify('ed25519')
      .update(Buffer.from(timestamp + body))
      .verify(Buffer.from(publicKey, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

function reply(content: string, ephemeral = false) {
  return Response.json({
    type: 4,
    data: { content, flags: ephemeral ? 64 : 0 },
  })
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature-ed25519') ?? ''
  const timestamp  = request.headers.get('x-signature-timestamp') ?? ''

  const publicKey = process.env.DISCORD_PUBLIC_KEY!
  if (!verifyDiscordSignature(publicKey, signature, timestamp, rawBody)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const interaction = JSON.parse(rawBody) as DiscordInteraction

  // PING — Discord vérifie que l'endpoint existe
  if (interaction.type === 1) {
    return Response.json({ type: 1 })
  }

  // APPLICATION_COMMAND
  if (interaction.type === 2 && interaction.data) {
    const { name, options = [] } = interaction.data
    const get = (k: string) => options.find(o => o.name === k)?.value ?? ''

    // ── /resultat gagnant:[nom] perdant:[nom] ──────────────────────────────
    if (name === 'resultat') {
      const nomGagnant = get('gagnant')
      const nomPerdant = get('perdant')

      if (!nomGagnant || !nomPerdant) {
        return reply('❌ Précise le gagnant et le perdant.', true)
      }

      let heritiers: Awaited<ReturnType<typeof readHeritiers>>['heritiers']
      let sha: string
      try {
        ({ heritiers, sha } = await readHeritiers())
      } catch {
        return reply('❌ Impossible de lire le classement. Réessaie dans quelques secondes.', true)
      }

      const gagnant = findHeritier(heritiers, nomGagnant)
      const perdant  = findHeritier(heritiers, nomPerdant)

      if (!gagnant) return reply(`❌ Héritier introuvable : **${nomGagnant}**\nVérifie l'orthographe du nom.`, true)
      if (!perdant)  return reply(`❌ Héritier introuvable : **${nomPerdant}**\nVérifie l'orthographe du nom.`, true)
      if (gagnant.id === perdant.id) return reply('❌ Le gagnant et le perdant ne peuvent pas être le même personnage.', true)

      const updated = heritiers.map(h => {
        if (h.id === gagnant.id) return { ...h, wins: h.wins + 1 }
        if (h.id === perdant.id) return { ...h, losses: h.losses + 1 }
        return h
      })

      const reporter = interaction.member?.user.username ?? interaction.user?.username ?? 'Inconnu'

      try {
        await writeHeritiers(
          updated,
          sha,
          `bot: ${gagnant.nom_personnage} bat ${perdant.nom_personnage} (rapporté par ${reporter})`
        )
      } catch {
        return reply('❌ Erreur lors de la mise à jour du classement. Contacte un admin.', true)
      }

      return reply(
        `⚔️ **Résultat enregistré**\n\n` +
        `🏆 **${gagnant.nom_personnage}** — V${gagnant.wins + 1} · D${gagnant.losses}\n` +
        `💀 **${perdant.nom_personnage}** — V${perdant.wins} · D${perdant.losses + 1}\n\n` +
        `_Le classement sera mis à jour dans ~30 secondes._`
      )
    }

    // ── /classement ────────────────────────────────────────────────────────
    if (name === 'classement') {
      let heritiers: Awaited<ReturnType<typeof readHeritiers>>['heritiers']
      try {
        ({ heritiers } = await readHeritiers())
      } catch {
        return reply('❌ Impossible de lire le classement.', true)
      }

      const actifs = heritiers
        .filter(h => h.actif)
        .sort((a, b) => a.position - b.position)

      if (actifs.length === 0) return reply('Aucun Héritier actif pour le moment.', true)

      const lignes = actifs.map(h => {
        const medal = h.position === 1 ? '🥇' : h.position === 2 ? '🥈' : h.position === 3 ? '🥉' : `**${h.position}.**`
        const clan = h.clan ? ` _(${h.clan})_` : ''
        return `${medal} ${h.nom_personnage}${clan} — V${h.wins} · D${h.losses}`
      }).join('\n')

      return reply(`**🌫️ Héritiers de la Brume — Classement**\n\n${lignes}`)
    }
  }

  return Response.json({ type: 1 })
}
