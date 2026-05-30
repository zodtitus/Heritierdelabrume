export type Rang = 'Chūnin' | 'Chūnin Confirmé'

export interface Heritier {
  id: string
  nom_personnage: string
  pseudo_joueur: string
  rang: Rang
  clan: string | null
  wins: number
  losses: number
  titre: string | null
  position: number
  actif: boolean
}
