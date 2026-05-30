-- =============================================
-- HÉRITIER DE LA BRUME — Schema Supabase
-- =============================================

create table if not exists heritiers (
  id              text        primary key,
  nom_personnage  text        not null default '',
  pseudo_joueur   text        not null default '',
  rang            text        not null default 'Chūnin',
  clan            text,
  wins            integer     not null default 0,
  losses          integer     not null default 0,
  titre           text,
  position        integer     not null,
  actif           boolean     not null default true,
  vacant          boolean     not null default false
);

-- Lecture publique, écriture via service role uniquement
alter table heritiers enable row level security;
create policy "heritiers_public_read" on heritiers for select using (true);

-- Données initiales (ajuster selon classement actuel)
insert into heritiers (id, nom_personnage, pseudo_joueur, rang, clan, wins, losses, titre, position, actif, vacant) values
  ('1',  'Ao Ren Yokushin',   '', 'Chūnin Confirmé', 'Yokushin',  0, 0, null, 1,  true, false),
  ('2',  'Yu Karatachi',      '', 'Chūnin Confirmé', 'Karatachi', 0, 0, null, 2,  true, false),
  ('3',  'Akira Kyo''ki',     '', 'Chūnin Confirmé', null,        0, 0, null, 3,  true, false),
  ('4',  'Kurozai Hoshigaki', '', 'Chūnin',          'Hoshigaki', 0, 0, null, 4,  true, false),
  ('5',  'Kiyomi K.Seishiro', '', 'Chūnin',          null,        0, 0, null, 5,  true, false),
  ('6',  'Thorkel Hoshigaki', '', 'Chūnin',          'Hoshigaki', 0, 1, null, 6,  true, false),
  ('7',  'Tengetsu Hōzuki',   '', 'Chūnin',          'Hōzuki',    0, 0, null, 7,  true, false),
  ('8',  '',                  '', 'Chūnin',          null,        0, 0, null, 8,  true, true),
  ('9',  '',                  '', 'Chūnin',          null,        0, 0, null, 9,  true, true),
  ('10', '',                  '', 'Chūnin',          null,        0, 0, null, 10, true, true)
on conflict (id) do nothing;
