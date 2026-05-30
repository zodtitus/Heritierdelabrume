import { NextRequest } from 'next/server'

// Récupère le channel_id depuis l'URL du webhook Discord
async function getWebhookChannelId(webhookUrl: string, botToken: string): Promise<string | null> {
  const match = webhookUrl.match(/webhooks\/(\d+)\//)
  if (!match) return null
  const webhookId = match[1]

  const res = await fetch(`https://discord.com/api/v10/webhooks/${webhookId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  })
  if (!res.ok) return null
  const data = await res.json() as { channel_id?: string }
  return data.channel_id ?? null
}

async function createMatchThread(
  demandeur_nom: string,
  demandeur_pseudo: string,
  cible_id: string,
  cible_nom: string,
  cible_position: number,
): Promise<string | null> {
  const botToken   = process.env.DISCORD_BOT_TOKEN
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!botToken) return 'DISCORD_BOT_TOKEN manquant'

  const h = { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' }

  // Utilise le channel du webhook existant si DISCORD_MATCH_CHANNEL_ID échoue
  let channelId = process.env.DISCORD_MATCH_CHANNEL_ID
  if (!channelId && webhookUrl) {
    channelId = await getWebhookChannelId(webhookUrl, botToken) ?? undefined
  }
  if (!channelId) return 'Aucun channel configuré'

  // 1. Message parent dans le salon
  const msgRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      content: `⚔️ **${demandeur_nom}** défie **${cible_nom}** (place #${cible_position})`,
    }),
  })

  if (!msgRes.ok) {
    const err = await msgRes.text()
    // Si ce channel échoue aussi, essayer le channel du webhook
    if (channelId === process.env.DISCORD_MATCH_CHANNEL_ID && webhookUrl) {
      const fallbackId = await getWebhookChannelId(webhookUrl, botToken)
      if (fallbackId && fallbackId !== channelId) {
        const retry = await fetch(`https://discord.com/api/v10/channels/${fallbackId}/messages`, {
          method: 'POST',
          headers: h,
          body: JSON.stringify({
            content: `⚔️ **${demandeur_nom}** défie **${cible_nom}** (place #${cible_position})`,
          }),
        })
        if (retry.ok) {
          const msg2 = await retry.json() as { id: string }
          return continueThread(h, fallbackId, msg2.id, demandeur_nom, demandeur_pseudo, cible_id, cible_nom, cible_position)
        }
      }
    }
    return `Erreur message parent: ${msgRes.status} — ${err}`
  }

  const msg = await msgRes.json() as { id: string }
  return continueThread(h, channelId, msg.id, demandeur_nom, demandeur_pseudo, cible_id, cible_nom, cible_position)
}

async function continueThread(
  h: Record<string, string>,
  channelId: string,
  messageId: string,
  demandeur_nom: string,
  demandeur_pseudo: string,
  cible_id: string,
  cible_nom: string,
  cible_position: number,
): Promise<string | null> {
  // 2. Créer thread depuis le message
  const threadName = `⚔️ ${demandeur_nom} vs ${cible_nom}`.slice(0, 100)
  const threadRes = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/threads`,
    {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ name: threadName, auto_archive_duration: 1440 }),
    }
  )

  if (!threadRes.ok) {
    const err = await threadRes.text()
    return `Erreur création thread: ${threadRes.status} — ${err}`
  }

  const thread = await threadRes.json() as { id: string }

  // 3. Boutons résultat dans le thread
  const nomSafe    = demandeur_nom.slice(0, 40).replace(/\|/g, '-')
  const pseudoSafe = demandeur_pseudo.slice(0, 20).replace(/\|/g, '-')

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
            label: `🏆 ${demandeur_nom.slice(0, 20)} gagne`,
            style: 3,
          },
          {
            type: 2,
            custom_id: `hw|${cible_id}`,
            label: `🛡️ ${cible_nom.slice(0, 20)} conserve`,
            style: 1,
          },
          {
            type: 2,
            custom_id: 'mc',
            label: '❌ Annuler le match',
            style: 4,
          },
        ],
      }],
    }),
  })

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { demandeur_nom, demandeur_pseudo, cible_id, cible_nom, cible_position, message } = body

    // Notification webhook embed
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
              { name: 'Cible', value: `${cible_nom} (#${cible_position ?? '?'})`, inline: true },
              { name: 'Message', value: message || '*Aucun message*', inline: false },
            ],
            footer: { text: 'Héritier de la Brume · Kirigakure' },
            timestamp: new Date().toISOString(),
          }],
        }),
      }).catch(() => {})
    }

    // Thread de match
    let threadError: string | null = null
    if (cible_id && cible_position) {
      threadError = await createMatchThread(demandeur_nom, demandeur_pseudo, cible_id, cible_nom, cible_position)
    }

    return Response.json({ ok: true, threadError })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}
