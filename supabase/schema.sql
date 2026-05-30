-- =============================================
-- HÉRITIER DE LA BRUME — Schema Neon (Postgres)
-- À exécuter dans l'éditeur SQL de Neon
-- =============================================

create table if not exists heritiers (
  id              uuid        default gen_random_uuid() primary key,
  nom_personnage  text        not null,
  pseudo_joueur   text        not null,
  rang            text        not null check (rang in ('Chūnin', 'Chūnin Confirmé')),
  clan            text,
  wins            integer     default 0 not null,
  losses          integer     default 0 not null,
  titre           text,
  position        integer     unique,
  actif           boolean     default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger heritiers_updated_at
  before update on heritiers
  for each row execute function update_updated_at();

create table if not exists duel_requests (
  id               uuid        default gen_random_uuid() primary key,
  demandeur_nom    text        not null,
  demandeur_pseudo text        not null,
  cible_id         uuid        references heritiers(id) on delete set null,
  cible_nom        text        not null,
  message          text,
  statut           text        default 'en_attente'
                               check (statut in ('en_attente', 'accepté', 'refusé', 'complété')),
  created_at       timestamptz default now()
);

-- Données de test (supprimer avant la mise en production si souhaité)
insert into heritiers (nom_personnage, pseudo_joueur, rang, clan, wins, losses, titre, position, actif)
values
  ('Mizuhime Hōzuki',   'mizuhime_kiri',  'Chūnin Confirmé', 'Hōzuki',    12, 2,  'Lame du Silence',      1, true),
  ('Kagetsu Karatachi', 'kagetsu_rp',     'Chūnin Confirmé', 'Karatachi',  9, 3,  'Brouillard Tranchant', 2, true),
  ('Tenrō Hoshigaki',   'tenro_shark',    'Chūnin Confirmé', 'Hoshigaki',  8, 4,  'Requin Immobile',      3, true),
  ('Saya Tensho',       'sayatensho_rp',  'Chūnin',          null,         5, 5,  'Sans Clan, Sans Peur', 4, true),
  ('Daizo Yokushin',    'daizo_yokushin', 'Chūnin',          'Yokushin',   3, 7,  null,                   5, true);
