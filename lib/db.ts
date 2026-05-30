import { supabase } from './supabase'
import type { Heritier } from './types'

export async function getHeritiers(): Promise<Heritier[]> {
  const { data, error } = await supabase
    .from('heritiers')
    .select('*')
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as Heritier[]
}

export async function getActiveHeritiers(): Promise<Heritier[]> {
  const { data, error } = await supabase
    .from('heritiers')
    .select('*')
    .eq('actif', true)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as Heritier[]
}

export async function saveAllHeritiers(heritiers: Heritier[]): Promise<void> {
  const { data: existing } = await supabase.from('heritiers').select('id')
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const newIds = new Set(heritiers.map(h => h.id))

  const toDelete = [...existingIds].filter(id => !newIds.has(id))
  if (toDelete.length > 0) {
    const { error } = await supabase.from('heritiers').delete().in('id', toDelete)
    if (error) throw error
  }

  if (heritiers.length > 0) {
    const { error } = await supabase.from('heritiers').upsert(heritiers, { onConflict: 'id' })
    if (error) throw error
  }
}

export async function updateHeritier(id: string, fields: Partial<Heritier>): Promise<void> {
  const { error } = await supabase.from('heritiers').update(fields).eq('id', id)
  if (error) throw error
}

export async function insertHeritier(heritier: Heritier): Promise<void> {
  const { error } = await supabase.from('heritiers').insert(heritier)
  if (error) throw error
}

export async function shiftPositionsDown(fromPosition: number): Promise<void> {
  // Incrémente la position de tous les héritiers à partir d'une position donnée
  const { data } = await supabase
    .from('heritiers')
    .select('id, position')
    .gte('position', fromPosition)

  for (const row of data ?? []) {
    await supabase.from('heritiers').update({ position: row.position + 1 }).eq('id', row.id)
  }
}
