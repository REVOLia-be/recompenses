-- =============================================================================
-- Pépites — schéma initial (schéma Postgres dédié `pepites`, pas `public`)
-- =============================================================================
--
-- ÉTAPE MANUELLE OBLIGATOIRE : EXPOSER LE SCHÉMA `pepites` À L'API (PostgREST)
-- ---------------------------------------------------------------------------
-- Sans cela, supabase-js répond « Invalid schema: pepites » / PGRST106.
--
--   Option A (recommandée) — tableau de bord :
--     Project Settings → API (« Data API ») → « Exposed schemas » → ajouter
--     `pepites` (en gardant `public` / `graphql_public` si la base est partagée
--     avec un autre projet) → Save.
--
--   Option B — SQL équivalent (à exécuter dans le SQL editor) :
--     -- 1) lire la valeur actuelle pour NE PAS écraser les schémas déjà exposés :
--     --    select rolconfig from pg_roles where rolname = 'authenticator';
--     -- 2) la réécrire en ajoutant pepites (adapter la liste) :
--     alter role authenticator set pgrst.db_schemas = 'public, graphql_public, pepites';
--     notify pgrst, 'reload config';
--     notify pgrst, 'reload schema';
--
--   Les GRANT nécessaires sont déjà faits plus bas dans ce fichier. N'exécutez PAS
--   le bloc générique de la doc (« GRANT ALL ... TO anon, authenticated, service_role »)
--   car il ouvrirait aussi les tables à `anon` (la RLS protégerait quand même, mais
--   on veut zéro droit pour anon). Doc : https://supabase.com/docs/guides/api/using-custom-schemas
--
-- Autres réglages dashboard : Authentication → Providers → Email (confirmation
-- d'e-mail oui/non) ; Authentication → URL Configuration (Site URL + Redirect URLs).
--
-- Choix de conception :
--  * Un utilisateur = au plus un parent = au plus une famille (parents.user_id unique).
--  * Les clés étrangères enfant/récompense/mission sont composites (id, family_id) :
--    impossible de rattacher une ligne à l'enfant d'une autre famille, même en
--    contournant l'appli.
--  * Le client ne peut PAS insérer directement : families, parents, redemptions,
--    mission_completions, ni des point_events de kind 'reward'/'mission'.
--    Tout passe par les RPC security definer ci-dessous.
-- =============================================================================

create schema if not exists pepites;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists pepites.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists pepites.parents (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references pepites.families(id) on delete cascade,
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  role_label  text not null default '' check (char_length(role_label) <= 40),
  emoji       text not null default '🙂' check (char_length(emoji) <= 16),
  birthdate   date,
  email       text,
  created_at  timestamptz not null default now()
);
create index if not exists parents_family_id_idx on pepites.parents (family_id);

create table if not exists pepites.children (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references pepites.families(id) on delete cascade,
  name           text not null check (char_length(btrim(name)) between 1 and 60),
  emoji          text not null default '🙂' check (char_length(emoji) <= 16),
  color          text not null default '#FFD166' check (char_length(color) <= 20),
  birthdate      date,
  companion_name text not null default '' check (char_length(companion_name) <= 60),
  created_at     timestamptz not null default now(),
  unique (id, family_id)
);
create index if not exists children_family_id_idx on pepites.children (family_id);

create table if not exists pepites.actions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references pepites.families(id) on delete cascade,
  label      text not null check (char_length(btrim(label)) between 1 and 120),
  emoji      text not null default '⭐' check (char_length(emoji) <= 16),
  points     integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists actions_family_id_idx on pepites.actions (family_id);

create table if not exists pepites.point_events (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references pepites.families(id) on delete cascade,
  child_id   uuid not null,
  points     integer not null,
  label      text not null default '' check (char_length(label) <= 200),
  emoji      text not null default '' check (char_length(emoji) <= 16),
  kind       text not null check (kind in ('action', 'manual', 'mission', 'reward', 'adjustment')),
  ref_id     uuid,
  created_by uuid references pepites.parents(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (child_id, family_id) references pepites.children (id, family_id) on delete cascade
);
create index if not exists point_events_family_id_idx on pepites.point_events (family_id);
create index if not exists point_events_child_created_idx on pepites.point_events (child_id, created_at desc);

create table if not exists pepites.rewards (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references pepites.families(id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 120),
  emoji      text not null default '🎁' check (char_length(emoji) <= 16),
  -- Chemin de l'objet dans le bucket `pepites-rewards` (« <family_id>/<uuid>.jpg »)
  -- ou URL externe ; le client re-signe les chemins au chargement.
  image_url  text,
  cost       integer not null default 0 check (cost >= 0),
  category   text not null default '' check (char_length(category) <= 60),
  mode       text not null default 'spend' check (mode in ('spend', 'weekly')),
  favorite   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, family_id)
);
create index if not exists rewards_family_id_idx on pepites.rewards (family_id);

create table if not exists pepites.redemptions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references pepites.families(id) on delete cascade,
  reward_id  uuid not null,
  child_id   uuid not null,
  cost       integer not null default 0,
  week_key   text check (week_key is null or week_key ~ '^\d{4}-\d{2}-\d{2}$'),
  created_by uuid references pepites.parents(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (reward_id, family_id) references pepites.rewards  (id, family_id) on delete cascade,
  foreign key (child_id,  family_id) references pepites.children (id, family_id) on delete cascade
);
create index if not exists redemptions_family_id_idx on pepites.redemptions (family_id);
create index if not exists redemptions_child_id_idx  on pepites.redemptions (child_id);
-- Une récompense « weekly » ne peut être offerte qu'une fois par enfant et par semaine.
create unique index if not exists redemptions_weekly_once_idx
  on pepites.redemptions (reward_id, child_id, week_key) where week_key is not null;

create table if not exists pepites.missions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references pepites.families(id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 120),
  emoji      text not null default '🎯' check (char_length(emoji) <= 16),
  points     integer not null default 1,
  recurrence text not null default 'once' check (recurrence in ('once', 'daily', 'weekly')),
  child_ids  uuid[] not null default '{}',   -- vide = tous les enfants
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, family_id)
);
create index if not exists missions_family_id_idx on pepites.missions (family_id);

create table if not exists pepites.mission_completions (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references pepites.families(id) on delete cascade,
  mission_id uuid not null,
  child_id   uuid not null,
  period_key text not null check (char_length(period_key) <= 20),
  event_id   uuid references pepites.point_events(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (mission_id, family_id) references pepites.missions (id, family_id) on delete cascade,
  foreign key (child_id,   family_id) references pepites.children (id, family_id) on delete cascade,
  unique (mission_id, child_id, period_key)
);
create index if not exists mission_completions_family_id_idx on pepites.mission_completions (family_id);
create index if not exists mission_completions_child_id_idx  on pepites.mission_completions (child_id);

-- -----------------------------------------------------------------------------
-- Fonctions utilitaires
-- -----------------------------------------------------------------------------

-- family_id du parent connecté. security definer => lit `parents` sans passer par la
-- RLS de `parents` (évite toute récursion de politique, puisque les politiques de
-- `parents` appellent elles-mêmes cette fonction).
create or replace function pepites.my_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.family_id from pepites.parents p where p.user_id = (select auth.uid()) limit 1
$$;

-- Code d'invitation lisible : 8 caractères, alphabet sans I, O, 0, 1. Aléa issu de
-- gen_random_uuid() (CSPRNG). Usage interne uniquement (non exécutable par les clients).
create or replace function pepites.gen_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_code  text;
  i       integer;
begin
  loop
    v_bytes := pg_catalog.decode(pg_catalog.replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    for i in 0..7 loop
      v_code := v_code || pg_catalog.substr(v_alphabet, (pg_catalog.get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from pepites.families f where f.invite_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC : création / adhésion famille
-- -----------------------------------------------------------------------------

create or replace function pepites.create_family(
  p_family_name text,
  p_parent_name text,
  p_role_label  text,
  p_emoji       text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_family uuid;
  v_email  text;
begin
  if v_uid is null then
    raise exception 'Connexion requise.';
  end if;
  if exists (select 1 from pepites.parents p where p.user_id = v_uid) then
    raise exception 'Tu fais déjà partie d''une famille.';
  end if;
  if pg_catalog.btrim(coalesce(p_family_name, '')) = '' or pg_catalog.btrim(coalesce(p_parent_name, '')) = '' then
    raise exception 'Le nom de la famille et ton prénom sont obligatoires.';
  end if;

  v_email := nullif(auth.jwt() ->> 'email', '');

  insert into pepites.families (name, invite_code)
  values (pg_catalog.btrim(p_family_name), pepites.gen_invite_code())
  returning id into v_family;

  insert into pepites.parents (family_id, user_id, name, role_label, emoji, email)
  values (v_family, v_uid, pg_catalog.btrim(p_parent_name),
          coalesce(pg_catalog.btrim(p_role_label), ''), coalesce(nullif(p_emoji, ''), '🙂'), v_email);

  insert into pepites.actions (family_id, label, emoji, points, sort_order) values
    (v_family, 'A rangé sa chambre',            '🧸', 2, 0),
    (v_family, 'A mis la table',                '🍽️', 1, 1),
    (v_family, 'A aidé sans qu''on demande',    '💛', 3, 2),
    (v_family, 'Devoirs faits',                 '📚', 2, 3),
    (v_family, 'S''est brossé les dents',       '🪥', 1, 4),
    (v_family, 'A été gentil avec les autres',  '🤝', 2, 5),
    (v_family, 'A bien mangé',                  '🥦', 1, 6),
    (v_family, 'Est allé au lit sans râler',    '🌙', 2, 7);

  return v_family;
end;
$$;

create or replace function pepites.join_family(
  p_invite_code text,
  p_parent_name text,
  p_role_label  text,
  p_emoji       text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_family uuid;
  v_email  text;
begin
  if v_uid is null then
    raise exception 'Connexion requise.';
  end if;
  if exists (select 1 from pepites.parents p where p.user_id = v_uid) then
    raise exception 'Tu fais déjà partie d''une famille.';
  end if;
  if pg_catalog.btrim(coalesce(p_parent_name, '')) = '' then
    raise exception 'Ton prénom est obligatoire.';
  end if;

  -- Verrouille la famille pour sérialiser les adhésions simultanées (limite de 4).
  select f.id into v_family
  from pepites.families f
  where f.invite_code = pg_catalog.upper(pg_catalog.btrim(coalesce(p_invite_code, '')))
  for update;

  if v_family is null then
    raise exception 'Code d''invitation inconnu. Vérifie le code et réessaie.';
  end if;

  if (select count(*) from pepites.parents p where p.family_id = v_family) >= 4 then
    raise exception 'Cette famille compte déjà 4 parents : impossible d''en ajouter.';
  end if;

  v_email := nullif(auth.jwt() ->> 'email', '');

  insert into pepites.parents (family_id, user_id, name, role_label, emoji, email)
  values (v_family, v_uid, pg_catalog.btrim(p_parent_name),
          coalesce(pg_catalog.btrim(p_role_label), ''), coalesce(nullif(p_emoji, ''), '🙂'), v_email);

  return v_family;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC : récompenses
-- -----------------------------------------------------------------------------
-- NOTE « weekly » : les points de la semaine dépendent du fuseau horaire local de
-- l'appareil (lundi 00:00 local, cf. domain/logic.ts → weekPoints). Le serveur ne peut
-- pas les recalculer exactement ; il fait donc confiance à `p_expected_have` (calculé
-- par le client) mais le borne : >= coût, et <= somme des points POSITIFS non-'reward'
-- du enfant depuis la veille du lundi indiqué (marge fuseau). Il garantit en revanche
-- côté serveur : appartenance famille, lundi valide et proche d'aujourd'hui, et
-- unicité par (récompense, enfant, semaine).
-- Mode 'spend' : le solde est recalculé sur le serveur (enfant verrouillé pour éviter
-- les doubles dépenses concurrentes) ; `p_expected_have` sert à détecter un solde
-- qui aurait baissé depuis l'affichage du client.

create or replace function pepites.redeem_reward(
  p_reward_id     uuid,
  p_child_id      uuid,
  p_week_key      text,
  p_expected_have integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_family  uuid;
  v_me      uuid;
  v_reward  pepites.rewards%rowtype;
  v_child   uuid;
  v_balance bigint;
  v_max     bigint;
  v_wk      date;
  v_red     uuid;
begin
  if v_uid is null then
    raise exception 'Connexion requise.';
  end if;
  v_family := pepites.my_family_id();
  if v_family is null then
    raise exception 'Tu dois d''abord créer ou rejoindre une famille.';
  end if;
  select p.id into v_me from pepites.parents p where p.user_id = v_uid;

  select * into v_reward from pepites.rewards r where r.id = p_reward_id and r.family_id = v_family;
  if not found then
    raise exception 'Récompense introuvable.';
  end if;

  -- Verrou sur l'enfant : sérialise les échanges concurrents pour cet enfant.
  select c.id into v_child from pepites.children c
  where c.id = p_child_id and c.family_id = v_family
  for update;
  if not found then
    raise exception 'Enfant introuvable.';
  end if;

  if v_reward.mode = 'spend' then
    select coalesce(sum(e.points), 0) into v_balance
    from pepites.point_events e where e.child_id = p_child_id;

    if v_balance < v_reward.cost then
      raise exception 'Pas assez de points : il en manque %.', (v_reward.cost - v_balance);
    end if;
    if p_expected_have is not null and v_balance < p_expected_have then
      raise exception 'Le solde a changé entre-temps. Actualise la page et réessaie.';
    end if;

    insert into pepites.redemptions (family_id, reward_id, child_id, cost, week_key, created_by)
    values (v_family, v_reward.id, p_child_id, v_reward.cost, null, v_me)
    returning id into v_red;

    insert into pepites.point_events (family_id, child_id, points, label, emoji, kind, ref_id, created_by)
    values (v_family, p_child_id, -v_reward.cost, v_reward.title, v_reward.emoji, 'reward', v_reward.id, v_me);

  else -- 'weekly'
    if p_week_key is null or p_week_key !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Semaine invalide.';
    end if;
    begin
      v_wk := p_week_key::date;
    exception when others then
      raise exception 'Semaine invalide.';
    end;
    if extract(isodow from v_wk) <> 1 or abs(v_wk - current_date) > 8 then
      raise exception 'Semaine invalide.';
    end if;

    if exists (
      select 1 from pepites.redemptions r
      where r.reward_id = v_reward.id and r.child_id = p_child_id and r.week_key = p_week_key
    ) then
      raise exception 'Cette récompense a déjà été offerte cette semaine.';
    end if;

    if p_expected_have is null or p_expected_have < v_reward.cost then
      raise exception 'Objectif de la semaine pas encore atteint.';
    end if;
    select coalesce(sum(e.points), 0) into v_max
    from pepites.point_events e
    where e.child_id = p_child_id and e.kind <> 'reward' and e.points > 0
      and e.created_at >= ((v_wk - 1)::timestamp at time zone 'UTC');
    if p_expected_have > v_max then
      raise exception 'Les points de la semaine ont changé. Actualise la page et réessaie.';
    end if;

    begin
      insert into pepites.redemptions (family_id, reward_id, child_id, cost, week_key, created_by)
      values (v_family, v_reward.id, p_child_id, v_reward.cost, p_week_key, v_me)
      returning id into v_red;
    exception when unique_violation then
      raise exception 'Cette récompense a déjà été offerte cette semaine.';
    end;
  end if;

  return v_red;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC : missions
-- -----------------------------------------------------------------------------

create or replace function pepites.complete_mission(
  p_mission_id uuid,
  p_child_id   uuid,
  p_period_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_family  uuid;
  v_me      uuid;
  v_mission pepites.missions%rowtype;
  v_child   uuid;
  v_day     date;
  v_event   uuid;
  v_comp    uuid;
begin
  if v_uid is null then
    raise exception 'Connexion requise.';
  end if;
  v_family := pepites.my_family_id();
  if v_family is null then
    raise exception 'Tu dois d''abord créer ou rejoindre une famille.';
  end if;
  select p.id into v_me from pepites.parents p where p.user_id = v_uid;

  select * into v_mission from pepites.missions m where m.id = p_mission_id and m.family_id = v_family;
  if not found then
    raise exception 'Mission introuvable.';
  end if;
  if not v_mission.active then
    raise exception 'Cette mission est désactivée.';
  end if;

  select c.id into v_child from pepites.children c
  where c.id = p_child_id and c.family_id = v_family
  for update;
  if not found then
    raise exception 'Enfant introuvable.';
  end if;
  if coalesce(array_length(v_mission.child_ids, 1), 0) > 0 and not (p_child_id = any (v_mission.child_ids)) then
    raise exception 'Cette mission ne concerne pas cet enfant.';
  end if;

  -- Cohérence de la clé de période avec la récurrence (fuseaux : marge de ±2 / ±8 jours).
  if v_mission.recurrence = 'once' then
    if p_period_key is distinct from 'once' then
      raise exception 'Période invalide.';
    end if;
  else
    if p_period_key is null or p_period_key !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Période invalide.';
    end if;
    begin
      v_day := p_period_key::date;
    exception when others then
      raise exception 'Période invalide.';
    end;
    if v_mission.recurrence = 'daily' and abs(v_day - current_date) > 2 then
      raise exception 'Période invalide.';
    end if;
    if v_mission.recurrence = 'weekly'
       and (extract(isodow from v_day) <> 1 or abs(v_day - current_date) > 8) then
      raise exception 'Période invalide.';
    end if;
  end if;

  if exists (
    select 1 from pepites.mission_completions mc
    where mc.mission_id = p_mission_id and mc.child_id = p_child_id and mc.period_key = p_period_key
  ) then
    raise exception 'Mission déjà validée pour cette période.';
  end if;

  begin
    insert into pepites.point_events (family_id, child_id, points, label, emoji, kind, ref_id, created_by)
    values (v_family, p_child_id, v_mission.points, v_mission.title, v_mission.emoji, 'mission', v_mission.id, v_me)
    returning id into v_event;

    insert into pepites.mission_completions (family_id, mission_id, child_id, period_key, event_id)
    values (v_family, p_mission_id, p_child_id, p_period_key, v_event)
    returning id into v_comp;
  exception when unique_violation then
    -- le sous-bloc est annulé : l'événement de points n'est pas conservé
    raise exception 'Mission déjà validée pour cette période.';
  end;

  return v_comp;
end;
$$;

create or replace function pepites.uncomplete_mission(p_completion_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_family uuid;
  v_event  uuid;
begin
  if v_uid is null then
    raise exception 'Connexion requise.';
  end if;
  v_family := pepites.my_family_id();
  if v_family is null then
    raise exception 'Tu dois d''abord créer ou rejoindre une famille.';
  end if;

  delete from pepites.mission_completions mc
  where mc.id = p_completion_id and mc.family_id = v_family
  returning mc.event_id into v_event;
  if not found then
    raise exception 'Validation introuvable.';
  end if;

  if v_event is not null then
    delete from pepites.point_events e where e.id = v_event and e.family_id = v_family;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Privilèges des fonctions (aucun accès pour public / anon)
-- -----------------------------------------------------------------------------

revoke all on function pepites.my_family_id()                                   from public, anon;
revoke all on function pepites.gen_invite_code()                                from public, anon, authenticated;
revoke all on function pepites.create_family(text, text, text, text)            from public, anon;
revoke all on function pepites.join_family(text, text, text, text)              from public, anon;
revoke all on function pepites.redeem_reward(uuid, uuid, text, integer)         from public, anon;
revoke all on function pepites.complete_mission(uuid, uuid, text)               from public, anon;
revoke all on function pepites.uncomplete_mission(uuid)                         from public, anon;

grant execute on function pepites.my_family_id()                                to authenticated;
grant execute on function pepites.create_family(text, text, text, text)         to authenticated;
grant execute on function pepites.join_family(text, text, text, text)           to authenticated;
grant execute on function pepites.redeem_reward(uuid, uuid, text, integer)      to authenticated;
grant execute on function pepites.complete_mission(uuid, uuid, text)            to authenticated;
grant execute on function pepites.uncomplete_mission(uuid)                      to authenticated;

-- -----------------------------------------------------------------------------
-- Privilèges des tables (RLS en plus) — rien pour anon
-- -----------------------------------------------------------------------------

grant usage on schema pepites to authenticated, service_role;

revoke all on all tables in schema pepites from anon, public;

grant select, update (name)                                   on pepites.families            to authenticated;
grant select, update (name, role_label, emoji, birthdate)     on pepites.parents             to authenticated;
grant select, insert, update, delete                          on pepites.children            to authenticated;
grant select, insert, update, delete                          on pepites.actions             to authenticated;
grant select, insert, delete                                  on pepites.point_events        to authenticated;
grant select, insert, update, delete                          on pepites.rewards             to authenticated;
grant select                                                  on pepites.redemptions         to authenticated;
grant select, insert, update, delete                          on pepites.missions            to authenticated;
grant select                                                  on pepites.mission_completions to authenticated;

grant all on all tables    in schema pepites to service_role;
grant all on all routines  in schema pepites to service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table pepites.families            enable row level security;
alter table pepites.parents             enable row level security;
alter table pepites.children            enable row level security;
alter table pepites.actions             enable row level security;
alter table pepites.point_events        enable row level security;
alter table pepites.rewards             enable row level security;
alter table pepites.redemptions         enable row level security;
alter table pepites.missions            enable row level security;
alter table pepites.mission_completions enable row level security;

-- families : lecture / renommage par les membres ; pas d'insert (create_family) ni de delete.
drop policy if exists families_select on pepites.families;
create policy families_select on pepites.families
  for select to authenticated
  using (id = (select pepites.my_family_id()));

drop policy if exists families_update on pepites.families;
create policy families_update on pepites.families
  for update to authenticated
  using (id = (select pepites.my_family_id()))
  with check (id = (select pepites.my_family_id()));

-- parents : lecture famille ; mise à jour de SA ligne uniquement ; pas d'insert direct.
drop policy if exists parents_select on pepites.parents;
create policy parents_select on pepites.parents
  for select to authenticated
  using (family_id = (select pepites.my_family_id()));

drop policy if exists parents_update_self on pepites.parents;
create policy parents_update_self on pepites.parents
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and family_id = (select pepites.my_family_id()));

-- Tables « tout membre lit/écrit les lignes de sa famille ».
do $$
declare
  t text;
begin
  foreach t in array array['children', 'actions', 'rewards', 'missions'] loop
    execute format('drop policy if exists %I on pepites.%I', t || '_family_all', t);
    execute format(
      'create policy %I on pepites.%I for all to authenticated '
      'using (family_id = (select pepites.my_family_id())) '
      'with check (family_id = (select pepites.my_family_id()))',
      t || '_family_all', t);
  end loop;
end $$;

-- point_events : lecture famille ; insert limité aux kinds « manuels » (les kinds
-- 'reward' / 'mission' ne naissent que dans les RPC) ; suppression idem.
drop policy if exists point_events_select on pepites.point_events;
create policy point_events_select on pepites.point_events
  for select to authenticated
  using (family_id = (select pepites.my_family_id()));

drop policy if exists point_events_insert on pepites.point_events;
create policy point_events_insert on pepites.point_events
  for insert to authenticated
  with check (
    family_id = (select pepites.my_family_id())
    and kind in ('action', 'manual', 'adjustment')
    and (
      created_by is null
      or created_by in (select p.id from pepites.parents p where p.family_id = (select pepites.my_family_id()))
    )
  );

drop policy if exists point_events_delete on pepites.point_events;
create policy point_events_delete on pepites.point_events
  for delete to authenticated
  using (
    family_id = (select pepites.my_family_id())
    and kind in ('action', 'manual', 'adjustment')
  );

-- redemptions / mission_completions : lecture seule côté client (écriture via RPC).
drop policy if exists redemptions_select on pepites.redemptions;
create policy redemptions_select on pepites.redemptions
  for select to authenticated
  using (family_id = (select pepites.my_family_id()));

drop policy if exists mission_completions_select on pepites.mission_completions;
create policy mission_completions_select on pepites.mission_completions
  for select to authenticated
  using (family_id = (select pepites.my_family_id()));

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'families', 'parents', 'children', 'actions', 'point_events',
      'rewards', 'redemptions', 'missions', 'mission_completions'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'pepites' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table pepites.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Storage : bucket privé « pepites-rewards », dossier « <family_id>/… »
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pepites-rewards', 'pepites-rewards', false, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pepites_rewards_select" on storage.objects;
create policy "pepites_rewards_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pepites-rewards'
    and (storage.foldername(name))[1] = (select pepites.my_family_id())::text
  );

drop policy if exists "pepites_rewards_insert" on storage.objects;
create policy "pepites_rewards_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pepites-rewards'
    and (storage.foldername(name))[1] = (select pepites.my_family_id())::text
  );

drop policy if exists "pepites_rewards_update" on storage.objects;
create policy "pepites_rewards_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'pepites-rewards'
    and (storage.foldername(name))[1] = (select pepites.my_family_id())::text
  )
  with check (
    bucket_id = 'pepites-rewards'
    and (storage.foldername(name))[1] = (select pepites.my_family_id())::text
  );

drop policy if exists "pepites_rewards_delete" on storage.objects;
create policy "pepites_rewards_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'pepites-rewards'
    and (storage.foldername(name))[1] = (select pepites.my_family_id())::text
  );

-- Recharge la config PostgREST (nouveau schéma / nouvelles fonctions).
notify pgrst, 'reload schema';
