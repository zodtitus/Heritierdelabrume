import { NextRequest } from 'next/server'

async function createMatchThread(
  demandeur_nom: string,
  demandeur_pseudo: string,
  cible_id: string,
  cible_nom: string,
  cible_position: number,
) {
  const channelId = process.env.DISCORD_MATCH_CHANNEL_ID
  const botToken  = process.env.DISCORD_BOT_TOKEN
  if (!channelId || !botToken) return

  const h = { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' }

  // 1. Créer le thread
  const threadRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/threads`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      name: `⚔️ ${demandeur_nom} vs ${cible_nom}`,
      type: 11,               // PUBLIC_THREAD
      auto_archive_duration: 1440,
    }),
  })
  if (!threadRes.ok) return
  const thread = await threadRes.json() as { id: string }

  // Tronquer pour respecter la limite de 100 chars du custom_id
  const nomSafe    = demandeur_nom.slice(0, 40).replace(/\|/g, '-')
  const pseudoSafe = demandeur_pseudo.slice(0, 20).replace(/\|/g, '-')

  // 2. Envoyer le message avec les boutons dans le thread
  await fetch(`https://discord.com/api/v10/channels/${thread.id}/messages`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      embeds: [{
        title: '⚔️ Match en attente de résultat',
        color: 0x4dd0e1,
        fields: [
          { name: '🗡️ Challenger', value: `**${demandeur_nom}**\n*${demandeur_pseudo}*`, inline: true },
          { name: '🛡️ Héritier défié', value: `**${cible_nom}**\n*Place #${cible_position}*`, inline: true },
        ],
        description: 'Une fois le match terminé, sélectionne le résultat ci-dessous.',
        footer: { text: 'Héritier de la Brume · Kirigakure' },
        timestamp: new Date().toISOString(),
      }],
      components: [{
        type: 1,
        components: [
          {
            type: 2,
            custom_id: `cw|${cible_id}|${nomSafe}|${pseudoSafe}`,
            label: `🏆 ${demandeur_nom.slice(0, 25)} gagne`,
            style: 3,
          },
          {
            type: 2,
            custom_id: `hw|${cible_id}`,
            label: `🛡️ ${cible_nom.slice(0, 25)} conserve`,
            style: 4,
          },
        ],
      }],
    }),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { demandeur_nom, demandeur_pseudo, cible_id, cible_nom, cible_position, message } = await request.json()

    // ── Notification webhook embed ─────────────────────────────────────────
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '⚔️ Nouveau défi — Héritier de la Brume',
            color: 0x4dd0e1,
            fields: [
              { name: 'Challenger', value: `${demandeur_nom} (${demandeur_pseudo})`, inline: true },
              { name: 'Cible', value: `${cible_nom} (#${cible_position})`, inline: true },
              { name: 'Message', value: message || '*Aucun message*', inline: false },
            ],
            footer: { text: 'Héritier de la Brume · Kirigakure' },
            timestamp: new Date().toISOString(),
          }],
        }),
      }).catch(() => {})
    }

    // ── Thread de match avec boutons résultat ──────────────────────────────
    if (cible_id && cible_position) {
      await createMatchThread(demandeur_nom, demandeur_pseudo, cible_id, cible_nom, cible_position)
    }

    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}
