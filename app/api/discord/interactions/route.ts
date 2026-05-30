import { NextRequest } from 'next/server'
import { verify as cryptoVerify, createPublicKey } from 'node:crypto'
import { readHeritiers, writeHeritiers } from '@/lib/github'
import heritieursData from '@/data/heritiers.json'
import type { Heritier } from '@/lib/types'

// ── Vérification signature Discord ────────────────────────────────────────────
const DER_HEADER = Buffer.from('302a300506032b6570032100', 'hex')

function verifySignature(publicKey: string, signature: string, timestamp: string, body: string): boolean {
  try {
    const key = createPublicKey({
      key: Buffer.concat([DER_HEADER, Buffer.from(publicKey, 'hex')]),
      format: 'der',
      type: 'spki',
    })
    return cryptoVerify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, 'hex'))
  } catch { return false }
}

// ── Helpers composants Discord ────────────────────────────────────────────────
function row(...components: object[]) {
  return { type: 1, components }
}

function select(customId: string, placeholder: string, options: { label: string; value: string; description?: string }[]) {
  return { type: 3, custom_id: customId, placeholder, min_values: 1, max_values: 1, options }
}

function btn(customId: string, label: string, style: number) {
  return { type: 2, custom_id: customId, label, style }
}

function options(heritiers: Heritier[], excludeId?: string) {
  return heritiers
    .filter(h => h.actif && !h.vacant && h.nom_personnage && h.id !== excludeId)
    .sort((a, b) => a.position - b.position)
    .map(h => ({
      label: h.nom_personnage,
      value: h.id,
      description: h.clan ? `Clan ${h.clan} · #${h.position}` : `Sans clan · #${h.position}`,
    }))
}

// Type 4 = nouvelle réponse éphémère, Type 7 = mise à jour du message existant
function reply(content: string, components: object[] = [], ephemeral = true) {
  return Response.json({ type: 4, data: { content, components, flags: ephemeral ? 64 : 0 } })
}
function update(content: string, components: object[] = []) {
  return Response.json({ type: 7, data: { content, components } })
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const rawBody  = await request.text()
  const sig      = request.headers.get('x-signature-ed25519') ?? ''
  const ts       = request.headers.get('x-signature-timestamp') ?? ''

  if (!verifySignature(process.env.DISCORD_PUBLIC_KEY!, sig, ts, rawBody)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const i = JSON.parse(rawBody) as {
    type: number
    channel_id?: string
    data?: { name?: string; custom_id?: string; values?: string[]; options?: { name: string; value: string }[] }
    member?: { user: { username: string } }
    user?: { username: string }
  }

  const heritiers = (heritieursData as Heritier[])

  // ── PING ────────────────────────────────────────────────────────────────────
  if (i.type === 1) return Response.json({ type: 1 })

  // ── SLASH COMMANDS ──────────────────────────────────────────────────────────
  if (i.type === 2) {
    const name = i.data?.name

    // /resultat — affiche le premier dropdown
    if (name === 'resultat') {
      const opts = options(heritiers)
      if (opts.length < 2) return reply('❌ Il faut au moins 2 Héritiers actifs pour enregistrer un résultat.')
      return reply(
        '⚔️ **Résultat d\'un match**\n\nQui a **gagné** ?',
        [row(select('sel_g', '🏆 Sélectionne le gagnant…', opts))]
      )
    }

    // /classement — affiche le classement
    if (name === 'classement') {
      const actifs = heritiers.filter(h => h.actif).sort((a, b) => a.position - b.position)
      if (actifs.length === 0) return reply('Aucun Héritier actif pour le moment.')
      const lignes = actifs.map(h => {
        const m = h.position === 1 ? '🥇' : h.position === 2 ? '🥈' : h.position === 3 ? '🥉' : `**${h.position}.**`
        const clan = h.clan ? ` *(${h.clan})*` : ''
        return `${m} ${h.nom_personnage}${clan} — V${h.wins} · D${h.losses}`
      }).join('\n')
      return reply(`**🌫️ Héritiers de la Brume — Classement**\n\n${lignes}`, [], false)
    }
  }

  // ── COMPOSANTS (select + boutons) ───────────────────────────────────────────
  if (i.type === 3 && i.data) {
    const { custom_id, values = [] } = i.data

    // Étape 1 — gagnant sélectionné → afficher dropdown perdant
    if (custom_id === 'sel_g') {
      const gagnantId = values[0]
      const gagnant = heritiers.find(h => h.id === gagnantId)
      if (!gagnant) return update('❌ Héritier introuvable. Réessaie.')

      const opts = options(heritiers, gagnantId)
      return update(
        `⚔️ **Résultat d'un match**\n🏆 Gagnant : **${gagnant.nom_personnage}**\n\nQui a **perdu** ?`,
        [row(select(`sel_p__${gagnantId}`, '💀 Sélectionne le perdant…', opts))]
      )
    }

    // Étape 2 — perdant sélectionné → demande confirmation
    if (custom_id?.startsWith('sel_p__')) {
      const gagnantId = custom_id.slice('sel_p__'.length)
      const perdantId = values[0]
      const gagnant = heritiers.find(h => h.id === gagnantId)
      const perdant  = heritiers.find(h => h.id === perdantId)
      if (!gagnant || !perdant) return update('❌ Héritier introuvable. Réessaie.')

      return update(
        `⚔️ **Confirmer le résultat**\n\n🏆 **${gagnant.nom_personnage}** bat **${perdant.nom_personnage}** 💀\n\nEst-ce correct ?`,
        [row(
          btn(`confirm__${gagnantId}__${perdantId}`, '✅  Confirmer', 3),
          btn('cancel', '❌  Annuler', 4)
        )]
      )
    }

    // Étape 3 — confirmation → mettre à jour les scores sur GitHub
    if (custom_id?.startsWith('confirm__')) {
      const [, gagnantId, perdantId] = custom_id.split('__')

      let ghHeritiers: Heritier[], sha: string
      try {
        ({ heritiers: ghHeritiers, sha } = await readHeritiers())
      } catch {
        return update('❌ Impossible de lire le classement. Réessaie dans quelques secondes.', [])
      }

      const gagnant = ghHeritiers.find(h => h.id === gagnantId)
      const perdant  = ghHeritiers.find(h => h.id === perdantId)
      if (!gagnant || !perdant) return update('❌ Données incohérentes. Contacte un admin.', [])

      const updated = ghHeritiers.map(h => {
        if (h.id === gagnantId) return { ...h, wins: h.wins + 1 }
        if (h.id === perdantId) return { ...h, losses: h.losses + 1 }
        return h
      })

      const reporter = i.member?.user.username ?? i.user?.username ?? 'Inconnu'
      try {
        await writeHeritiers(updated, sha, `bot: ${gagnant.nom_personnage} bat ${perdant.nom_personnage} (${reporter})`)
      } catch {
        return update('❌ Erreur lors de la sauvegarde. Contacte un admin.', [])
      }

      return update(
        `✅ **Résultat enregistré !**\n\n` +
        `🏆 **${gagnant.nom_personnage}** — V${gagnant.wins + 1} · D${gagnant.losses}\n` +
        `💀 **${perdant.nom_personnage}** — V${perdant.wins} · D${perdant.losses + 1}\n\n` +
        `*Classement mis à jour dans ~30 secondes.*`,
        []
      )
    }

    // Annulation résultat /resultat
    if (custom_id === 'cancel') {
      return update('❌ Résultat annulé.', [])
    }

    // Annulation match depuis ticket
    if (custom_id === 'mc') {
      archiveThread(i.channel_id, process.env.DISCORD_BOT_TOKEN)
      return update('❌ **Match annulé.** Aucune modification du classement.', [])
    }

    // ── Bouton ticket match : challenger gagne ─────────────────────────────
    // custom_id : cw|{cible_id}|{challenger_nom}|{challenger_pseudo}
    if (custom_id?.startsWith('cw|')) {
      const parts = custom_id.split('|')
      const cibleId        = parts[1]
      const challengerNom  = parts[2] ?? 'Inconnu'
      const challengerPseudo = parts[3] ?? ''

      let ghHeritiers: Heritier[], sha: string
      try { ({ heritiers: ghHeritiers, sha } = await readHeritiers()) }
      catch { return update('❌ Impossible de lire le classement. Réessaie.', []) }

      const cible = ghHeritiers.find(h => h.id === cibleId)
      if (!cible) return update('❌ Héritier introuvable.', [])

      const ciblePos = cible.position

      // Décaler tous les héritiers à partir de la position cible
      const shifted = ghHeritiers.map(h => {
        if (h.id === cibleId) return { ...h, losses: h.losses + 1, position: h.position + 1 }
        if (h.position >= ciblePos) return { ...h, position: h.position + 1 }
        return h
      })

      // Ajouter le challenger à la position libérée
      const newChallenger: Heritier = {
        id: Date.now().toString(),
        nom_personnage: challengerNom,
        pseudo_joueur: challengerPseudo,
        rang: 'Chūnin',
        clan: null,
        wins: 1,
        losses: 0,
        titre: null,
        position: ciblePos,
        actif: true,
      }

      const withChallenger = [...shifted, newChallenger]
      // Retirer les places vacantes poussées au-delà de 10
      const final = withChallenger.filter(h => h.position <= 10 || !h.vacant)

      try {
        await writeHeritiers(final, sha,
          `bot: ${challengerNom} bat ${cible.nom_personnage} — prend la place #${ciblePos}`)
      } catch {
        return update('❌ Erreur de sauvegarde. Contacte un admin.', [])
      }

      // Archiver le thread
      archiveThread(i.channel_id, process.env.DISCORD_BOT_TOKEN)

      return update(
        `✅ **Résultat enregistré !**\n\n` +
        `🏆 **${challengerNom}** prend la place **#${ciblePos}**\n` +
        `📉 **${cible.nom_personnage}** descend à la place #${ciblePos + 1} ` +
        `(V${cible.wins} · D${cible.losses + 1})\n\n` +
        `*Classement mis à jour dans ~30 secondes.*`,
        []
      )
    }

    // ── Bouton ticket match : héritier gagne ───────────────────────────────
    // custom_id : hw|{cible_id}
    if (custom_id?.startsWith('hw|')) {
      const cibleId = custom_id.split('|')[1]

      let ghHeritiers: Heritier[], sha: string
      try { ({ heritiers: ghHeritiers, sha } = await readHeritiers()) }
      catch { return update('❌ Impossible de lire le classement. Réessaie.', []) }

      const cible = ghHeritiers.find(h => h.id === cibleId)
      if (!cible) return update('❌ Héritier introuvable.', [])

      const updated = ghHeritiers.map(h =>
        h.id === cibleId ? { ...h, wins: h.wins + 1 } : h
      )

      try {
        await writeHeritiers(updated, sha,
          `bot: ${cible.nom_personnage} conserve sa place #${cible.position}`)
      } catch {
        return update('❌ Erreur de sauvegarde. Contacte un admin.', [])
      }

      archiveThread(i.channel_id, process.env.DISCORD_BOT_TOKEN)

      return update(
        `🛡️ **${cible.nom_personnage}** conserve sa place **#${cible.position}** !\n\n` +
        `V${cible.wins + 1} · D${cible.losses}\n\n` +
        `*Classement mis à jour dans ~30 secondes.*`,
        []
      )
    }
  }

  return Response.json({ type: 1 })
}

function archiveThread(channelId: string | undefined, botToken: string | undefined) {
  if (!channelId || !botToken) return
  fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived: true, locked: true }),
  }).catch(() => {})
}
