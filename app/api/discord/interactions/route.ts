import { NextRequest } from 'next/server'
import { verify as cryptoVerify, createPublicKey } from 'node:crypto'
import { getActiveHeritiers, getHeritiers, updateHeritier, insertHeritier, shiftPositionsDown } from '@/lib/db'
import type { Heritier } from '@/lib/types'

// ── Vérification signature Discord ────────────────────────────────────────────
const DER_HEADER = Buffer.from('302a300506032b6570032100', 'hex')

function verifySignature(publicKey: string, signature: string, timestamp: string, body: string): boolean {
  try {
    const key = createPublicKey({
      key: Buffer.concat([DER_HEADER, Buffer.from(publicKey, 'hex')]),
      format: 'der', type: 'spki',
    })
    return cryptoVerify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, 'hex'))
  } catch { return false }
}

// ── Helpers composants Discord ────────────────────────────────────────────────
function row(...components: object[]) { return { type: 1, components } }

function select(customId: string, placeholder: string, opts: { label: string; value: string; description?: string }[]) {
  return { type: 3, custom_id: customId, placeholder, min_values: 1, max_values: 1, options: opts }
}

function btn(customId: string, label: string, style: number) {
  return { type: 2, custom_id: customId, label, style }
}

function buildOptions(heritiers: Heritier[], excludeId?: string) {
  return heritiers
    .filter(h => h.actif && !h.vacant && h.nom_personnage && h.id !== excludeId)
    .sort((a, b) => a.position - b.position)
    .map(h => ({
      label: h.nom_personnage,
      value: h.id,
      description: h.clan ? `Clan ${h.clan} · #${h.position}` : `Sans clan · #${h.position}`,
    }))
}

function reply(content: string, components: object[] = [], ephemeral = true) {
  return Response.json({ type: 4, data: { content, components, flags: ephemeral ? 64 : 0 } })
}
function update(content: string, components: object[] = []) {
  return Response.json({ type: 7, data: { content, components } })
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const rawBody  = await request.text()
  const sig = request.headers.get('x-signature-ed25519') ?? ''
  const ts  = request.headers.get('x-signature-timestamp') ?? ''

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

  // ── PING ────────────────────────────────────────────────────────────────────
  if (i.type === 1) return Response.json({ type: 1 })

  // ── SLASH COMMANDS ──────────────────────────────────────────────────────────
  if (i.type === 2) {
    const name = i.data?.name

    if (name === 'resultat') {
      let heritiers: Heritier[]
      try { heritiers = await getActiveHeritiers() }
      catch { return reply('❌ Erreur de connexion à la base de données.') }

      const opts = buildOptions(heritiers)
      if (opts.length < 2) return reply('❌ Il faut au moins 2 Héritiers actifs.')
      return reply(
        '⚔️ **Résultat d\'un match**\n\nQui a **gagné** ?',
        [row(select('sel_g', '🏆 Sélectionne le gagnant…', opts))]
      )
    }

    if (name === 'classement') {
      let heritiers: Heritier[]
      try { heritiers = await getActiveHeritiers() }
      catch { return reply('❌ Erreur de connexion à la base de données.') }

      const actifs = heritiers.filter(h => !h.vacant)
      if (actifs.length === 0) return reply('Aucun Héritier actif.')
      const lignes = actifs.map(h => {
        const m = h.position === 1 ? '🥇' : h.position === 2 ? '🥈' : h.position === 3 ? '🥉' : `**${h.position}.**`
        const clan = h.clan ? ` *(${h.clan})*` : ''
        return `${m} ${h.nom_personnage}${clan} — V${h.wins} · D${h.losses}`
      }).join('\n')
      return reply(`**🌫️ Héritiers de la Brume — Classement**\n\n${lignes}`, [], false)
    }
  }

  // ── COMPOSANTS ──────────────────────────────────────────────────────────────
  if (i.type === 3 && i.data) {
    const { custom_id, values = [] } = i.data

    // Étape 1 — select gagnant
    if (custom_id === 'sel_g') {
      const gagnantId = values[0]
      let heritiers: Heritier[]
      try { heritiers = await getActiveHeritiers() }
      catch { return update('❌ Erreur DB. Réessaie.') }

      const gagnant = heritiers.find(h => h.id === gagnantId)
      if (!gagnant) return update('❌ Héritier introuvable.')
      const opts = buildOptions(heritiers, gagnantId)
      return update(
        `⚔️ **Résultat d'un match**\n🏆 Gagnant : **${gagnant.nom_personnage}**\n\nQui a **perdu** ?`,
        [row(select(`sel_p__${gagnantId}`, '💀 Sélectionne le perdant…', opts))]
      )
    }

    // Étape 2 — select perdant → confirmation
    if (custom_id?.startsWith('sel_p__')) {
      const gagnantId = custom_id.slice('sel_p__'.length)
      const perdantId = values[0]
      let heritiers: Heritier[]
      try { heritiers = await getActiveHeritiers() }
      catch { return update('❌ Erreur DB. Réessaie.') }

      const gagnant = heritiers.find(h => h.id === gagnantId)
      const perdant  = heritiers.find(h => h.id === perdantId)
      if (!gagnant || !perdant) return update('❌ Héritier introuvable.')
      return update(
        `⚔️ **Confirmer le résultat**\n\n🏆 **${gagnant.nom_personnage}** bat **${perdant.nom_personnage}** 💀\n\nEst-ce correct ?`,
        [row(btn(`confirm__${gagnantId}__${perdantId}`, '✅  Confirmer', 3), btn('cancel', '❌  Annuler', 4))]
      )
    }

    // Étape 3 — confirmation /resultat
    if (custom_id?.startsWith('confirm__')) {
      const [, gagnantId, perdantId] = custom_id.split('__')
      let heritiers: Heritier[]
      try { heritiers = await getHeritiers() }
      catch { return update('❌ Erreur DB.', []) }

      const gagnant = heritiers.find(h => h.id === gagnantId)
      const perdant  = heritiers.find(h => h.id === perdantId)
      if (!gagnant || !perdant) return update('❌ Données incohérentes.', [])

      try {
        await updateHeritier(gagnantId, { wins: gagnant.wins + 1 })
        await updateHeritier(perdantId, { losses: perdant.losses + 1 })
      } catch { return update('❌ Erreur de sauvegarde.', []) }

      return update(
        `✅ **Résultat enregistré !**\n\n` +
        `🏆 **${gagnant.nom_personnage}** — V${gagnant.wins + 1} · D${gagnant.losses}\n` +
        `💀 **${perdant.nom_personnage}** — V${perdant.wins} · D${perdant.losses + 1}`,
        []
      )
    }

    // Annulation /resultat
    if (custom_id === 'cancel') return update('❌ Résultat annulé.', [])

    // ── Boutons ticket match : challenger gagne ────────────────────────────
    if (custom_id?.startsWith('cw|')) {
      const parts = custom_id.split('|')
      const cibleId        = parts[1]
      const challengerNom  = parts[2] ?? 'Inconnu'
      const challengerPseudo = parts[3] ?? ''

      let heritiers: Heritier[]
      try { heritiers = await getHeritiers() }
      catch { return update('❌ Erreur DB. Réessaie.', []) }

      const cible = heritiers.find(h => h.id === cibleId)
      if (!cible) return update('❌ Héritier introuvable.', [])

      const ciblePos = cible.position

      try {
        // Décaler toutes les positions >= ciblePos vers le bas
        await shiftPositionsDown(ciblePos)
        // Mettre à jour la défaite du cible
        await updateHeritier(cibleId, { losses: cible.losses + 1 })
        // Insérer le challenger
        await insertHeritier({
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
        })
        // Supprimer la place vacante en trop si position > 10
        const all = await getHeritiers()
        const vacantBeyond = all.filter(h => h.vacant && h.position > 10)
        for (const v of vacantBeyond) {
          const { supabase } = await import('@/lib/supabase')
          await supabase.from('heritiers').delete().eq('id', v.id)
        }
      } catch { return update('❌ Erreur de sauvegarde.', []) }

      archiveThread(i.channel_id, process.env.DISCORD_BOT_TOKEN)
      return update(
        `✅ **Résultat enregistré !**\n\n` +
        `🏆 **${challengerNom}** prend la place **#${ciblePos}**\n` +
        `📉 **${cible.nom_personnage}** descend à la place #${ciblePos + 1} (V${cible.wins} · D${cible.losses + 1})`,
        []
      )
    }

    // ── Bouton ticket match : héritier gagne ──────────────────────────────
    if (custom_id?.startsWith('hw|')) {
      const cibleId = custom_id.split('|')[1]
      let heritiers: Heritier[]
      try { heritiers = await getHeritiers() }
      catch { return update('❌ Erreur DB. Réessaie.', []) }

      const cible = heritiers.find(h => h.id === cibleId)
      if (!cible) return update('❌ Héritier introuvable.', [])

      try { await updateHeritier(cibleId, { wins: cible.wins + 1 }) }
      catch { return update('❌ Erreur de sauvegarde.', []) }

      archiveThread(i.channel_id, process.env.DISCORD_BOT_TOKEN)
      return update(
        `🛡️ **${cible.nom_personnage}** conserve sa place **#${cible.position}** !\n` +
        `V${cible.wins + 1} · D${cible.losses}`,
        []
      )
    }

    // Annulation ticket match
    if (custom_id === 'mc') {
      archiveThread(i.channel_id, process.env.DISCORD_BOT_TOKEN)
      return update('❌ **Match annulé.** Aucune modification du classement.', [])
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
