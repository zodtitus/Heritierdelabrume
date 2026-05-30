import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { demandeur_nom, demandeur_pseudo, cible_nom, message } = await request.json()

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!webhookUrl) {
      return Response.json({ ok: false, error: 'Webhook non configuré' }, { status: 500 })
    }

    const embed = {
      embeds: [{
        title: '⚔️ Nouveau défi — Héritier de la Brume',
        color: 0x4dd0e1,
        fields: [
          { name: 'Challenger', value: `${demandeur_nom} (${demandeur_pseudo})`, inline: true },
          { name: 'Cible', value: cible_nom, inline: true },
          { name: 'Message', value: message || '*Aucun message*', inline: false },
        ],
        footer: { text: 'Héritier de la Brume · Kirigakure' },
        timestamp: new Date().toISOString(),
      }],
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    })

    if (!res.ok) {
      const text = await res.text()
      return Response.json({ ok: false, error: `Discord: ${text}` }, { status: 502 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}
