-- ============================================================================
--  MDI Build — Schéma Supabase
--  Modèle white-label : 1 projet Supabase = 1 entreprise.
--
--  À exécuter UNE FOIS dans : Supabase → votre projet → SQL Editor → New query
--  (copier-coller tout ce fichier, puis « Run »). Le script est idempotent :
--  vous pouvez le relancer sans risque.
-- ============================================================================

-- Fonction gen_random_uuid() (fournie par pgcrypto, présent par défaut).
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
--  Table unique : toutes les entités de l'application (projets, devis, tâches,
--  factures, messages, etc.). La colonne `collection` fait l'aiguillage et la
--  colonne JSONB `data` porte les champs métier propres à chaque entité.
-- ----------------------------------------------------------------------------
create table if not exists public.entites (
  id           uuid primary key default gen_random_uuid(),
  collection   text        not null,
  etat         text        not null default 'actif',   -- actif | archive | annule | supprime
  cree_le      timestamptz not null default now(),
  cree_par     text        not null default '',
  modifie_le   timestamptz not null default now(),
  modifie_par  text        not null default '',
  supprime_le  timestamptz,
  supprime_par text,
  archive_le   timestamptz,
  archive_par  text,
  annulation   jsonb,
  data         jsonb       not null default '{}'::jsonb
);

-- Index de performance.
create index if not exists entites_collection_idx      on public.entites (collection);
create index if not exists entites_collection_etat_idx on public.entites (collection, etat);
create index if not exists entites_data_gin            on public.entites using gin (data);

-- ----------------------------------------------------------------------------
--  Temps réel : diffuse les changements de la table vers l'application.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'entites'
  ) then
    alter publication supabase_realtime add table public.entites;
  end if;
end $$;

-- ----------------------------------------------------------------------------
--  Sécurité au niveau des lignes (RLS).
-- ----------------------------------------------------------------------------
alter table public.entites enable row level security;

-- OPTION A — DÉMARRAGE RAPIDE (mono-locataire white-label).
-- La clé publique « anon » embarquée dans l'app peut lire/écrire. Comme chaque
-- entreprise a SON propre projet Supabase isolé, la donnée reste cloisonnée par
-- projet. Convient pour mettre en service rapidement.
drop policy if exists entites_anon_all on public.entites;
create policy entites_anon_all on public.entites
  for all
  to anon
  using (true)
  with check (true);

-- OPTION B — RECOMMANDÉ (à activer quand l'authentification Supabase sera
-- branchée dans l'app). Réserve tout accès aux utilisateurs connectés.
-- Pour l'activer : supprimez la policy « entites_anon_all » ci-dessus, puis
-- décommentez le bloc suivant.
--
-- drop policy if exists entites_auth_all on public.entites;
-- create policy entites_auth_all on public.entites
--   for all
--   to authenticated
--   using (true)
--   with check (true);
