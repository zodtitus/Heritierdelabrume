import type { Heritier } from './types'

const REPO = 'zodtitus/Heritierdelabrume'
const FILE = 'data/heritiers.json'
const API  = `https://api.github.com/repos/${REPO}/contents/${FILE}`

function headers() {
  return {
    Authorization: `token ${process.env.GITHUB_TOKEN!}`,
    'Content-Type': 'application/json',
    'User-Agent': 'heritier-bot',
    Accept: 'application/vnd.github+json',
  }
}

export async function readHeritiers(): Promise<{ heritiers: Heritier[]; sha: string }> {
  const res = await fetch(API, { headers: headers(), cache: 'no-store' })
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`)
  const json = await res.json()
  const heritiers = JSON.parse(Buffer.from(json.content, 'base64').toString('utf-8')) as Heritier[]
  return { heritiers, sha: json.sha }
}

export async function writeHeritiers(heritiers: Heritier[], sha: string, message: string): Promise<void> {
  const content = Buffer.from(JSON.stringify(heritiers, null, 2)).toString('base64')
  const res = await fetch(API, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ message, content, sha }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub PUT failed: ${res.status} — ${err}`)
  }
}

// Trouve un héritier par nom (insensible à la casse et aux accents)
export function findHeritier(heritiers: Heritier[], nom: string): Heritier | undefined {
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  const query = normalize(nom)
  return heritiers.find(h => normalize(h.nom_personnage).includes(query) || query.includes(normalize(h.nom_personnage).split(' ')[0]))
}
