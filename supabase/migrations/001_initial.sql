-- ============================================================
-- Survey Platform – Initial migration
-- Esegui questo script nella SQL editor di Supabase
-- ============================================================

-- Enable UUID extension (già attivo su Supabase, ma per sicurezza)
create extension if not exists "pgcrypto";

-- ─── Tabella surveys ───────────────────────────────────────
create table if not exists surveys (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null default 'Questionario',
  intro_text          text not null default '',
  demographics_fields jsonb not null default '[]',
  videos              jsonb not null default '[]',
  is_published        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Tabella responses ─────────────────────────────────────
create table if not exists responses (
  id              uuid primary key default gen_random_uuid(),
  survey_id       uuid not null references surveys(id) on delete cascade,
  session_token   text not null unique,
  demographics    jsonb not null default '{}',
  answers         jsonb not null default '{}',
  consent         boolean not null default false,
  completed       boolean not null default false,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists responses_survey_id_idx on responses(survey_id);

-- ─── RLS ───────────────────────────────────────────────────
alter table surveys   enable row level security;
alter table responses enable row level security;

-- Anon: legge solo survey pubblicate
create policy "anon_read_published_surveys"
  on surveys for select
  to anon
  using (is_published = true);

-- Anon: può inserire/aggiornare risposte (upsert via session_token)
create policy "anon_upsert_responses"
  on responses for insert
  to anon
  with check (true);

create policy "anon_update_own_response"
  on responses for update
  to anon
  using (true)
  with check (true);

-- Authenticated (admin): accesso completo
create policy "admin_all_surveys"
  on surveys for all
  to authenticated
  using (true)
  with check (true);

create policy "admin_all_responses"
  on responses for all
  to authenticated
  using (true)
  with check (true);

-- ─── Bucket Storage per i video ────────────────────────────
-- Da eseguire dalla dashboard Supabase > Storage > New bucket
-- Nome: "videos", Public: true
-- Oppure via API:
-- insert into storage.buckets (id, name, public) values ('videos', 'videos', true);

-- ─── Seed: crea il survey con i 12 video reali ─────────────
-- Sostituisci <SUPABASE_PROJECT_URL> con l'URL del tuo progetto
-- dopo aver caricato i video su Storage

insert into surveys (
  id,
  title,
  intro_text,
  demographics_fields,
  videos,
  is_published
) values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Questionario sulle emozioni nei film',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Partecipando a questa ricerca accetti che i tuoi dati vengano utilizzati in forma anonima per scopi scientifici. Le tue risposte saranno trattate con la massima riservatezza.',
  '[
    {"id":"age","label":"Età","type":"number","required":true},
    {"id":"gender","label":"Genere","type":"select","required":true,"options":["Uomo","Donna","Non binario","Preferisco non specificare"]},
    {"id":"education","label":"Titolo di studio","type":"select","required":true,"options":["Licenza media","Diploma","Laurea triennale","Laurea magistrale o superiore"]}
  ]'::jsonb,
  '[
    {"id":"10_cloverfield_lane","storage_url":"<STORAGE_URL>/10_cloverfield_lane.mp4","title":"10 Cloverfield Lane","questions":[{"id":"10_cloverfield_lane_q1","text":"Come descriveresti l''emozione predominante in questo clip?","type":"single","options":[{"id":"joy","label":"Gioia"},{"id":"sadness","label":"Tristezza"},{"id":"fear","label":"Paura"},{"id":"anger","label":"Rabbia"},{"id":"surprise","label":"Sorpresa"},{"id":"disgust","label":"Disgusto"}]},{"id":"10_cloverfield_lane_q2","text":"Quali emozioni hai provato guardando questo clip?","type":"multiple","options":[{"id":"excited","label":"Eccitazione"},{"id":"calm","label":"Calma"},{"id":"tense","label":"Tensione"},{"id":"moved","label":"Commozione"},{"id":"amused","label":"Divertimento"},{"id":"uneasy","label":"Disagio"}]},{"id":"10_cloverfield_lane_q3","text":"Con quale intensità hai provato le seguenti emozioni?","type":"multiple_slider","options":[{"id":"happiness","label":"Felicità"},{"id":"melancholy","label":"Malinconia"},{"id":"anxiety","label":"Ansia"},{"id":"tenderness","label":"Tenerezza"},{"id":"admiration","label":"Ammirazione"}]}]},
    {"id":"500_days_of_summer","storage_url":"<STORAGE_URL>/500_days_of_summer.mp4","title":"500 Days Of Summer","questions":[{"id":"500_days_of_summer_q1","text":"Come descriveresti l''emozione predominante in questo clip?","type":"single","options":[{"id":"joy","label":"Gioia"},{"id":"sadness","label":"Tristezza"},{"id":"fear","label":"Paura"},{"id":"anger","label":"Rabbia"},{"id":"surprise","label":"Sorpresa"},{"id":"disgust","label":"Disgusto"}]},{"id":"500_days_of_summer_q2","text":"Quali emozioni hai provato guardando questo clip?","type":"multiple","options":[{"id":"excited","label":"Eccitazione"},{"id":"calm","label":"Calma"},{"id":"tense","label":"Tensione"},{"id":"moved","label":"Commozione"},{"id":"amused","label":"Divertimento"},{"id":"uneasy","label":"Disagio"}]},{"id":"500_days_of_summer_q3","text":"Con quale intensità hai provato le seguenti emozioni?","type":"multiple_slider","options":[{"id":"happiness","label":"Felicità"},{"id":"melancholy","label":"Malinconia"},{"id":"anxiety","label":"Ansia"},{"id":"tenderness","label":"Tenerezza"},{"id":"admiration","label":"Ammirazione"}]}]}
  ]'::jsonb,
  true
) on conflict (id) do nothing;

-- ─── Istruzioni per creare l'utente admin ──────────────────
-- Nella dashboard Supabase > Authentication > Users > Invite user
-- oppure via API:
--   POST https://<project>.supabase.co/auth/v1/admin/users
--   { "email": "admin@tuodominio.com", "password": "...", "email_confirm": true }
