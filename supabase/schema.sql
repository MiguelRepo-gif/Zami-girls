-- Zami Girls — Database Schema
-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- ─── MODELS ──────────────────────────────────────────────────────────────────
create table if not exists models (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz default now(),
  name          text not null,
  niche         text not null,
  mode          text default 'SFW' check (mode in ('SFW', 'NSFW')),
  current_phase int  default 1,
  status        text default 'active' check (status in ('active', 'paused', 'archived')),
  face_image_url   text,
  body_image_url   text
);

-- ─── PHASE IMAGES (faces & bodies) ───────────────────────────────────────────
create table if not exists phase_images (
  id               uuid primary key default uuid_generate_v4(),
  model_id         uuid references models(id) on delete cascade,
  phase            int  not null,           -- 1=face  2=body
  comfyui_prompt_id text,
  filename         text,
  image_url        text,
  prompt_used      text,
  seed             bigint,
  is_selected      boolean default false,
  created_at       timestamptz default now()
);

-- ─── PROFILE ─────────────────────────────────────────────────────────────────
create table if not exists model_profiles (
  id         uuid primary key default uuid_generate_v4(),
  model_id   uuid references models(id) on delete cascade unique,
  content    jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── CONTENT CALENDAR ────────────────────────────────────────────────────────
create table if not exists content_posts (
  id                uuid primary key default uuid_generate_v4(),
  model_id          uuid references models(id) on delete cascade,
  week_number       int,
  day_of_week       int,   -- 1–7
  slot              int,   -- 1–3 (up to 3 posts/day)
  caption           text,
  image_prompt      text,
  description       text,
  aspect_ratio      text default '9:16',
  status            text default 'pending' check (status in ('pending','approved','generating','done','published')),
  comfyui_prompt_id text,
  image_url         text,
  created_at        timestamptz default now()
);

-- ─── COMMUNITY RESPONSES ─────────────────────────────────────────────────────
create table if not exists community_responses (
  id               uuid primary key default uuid_generate_v4(),
  model_id         uuid references models(id) on delete cascade,
  comment_example  text not null,
  response_example text not null,
  created_at       timestamptz default now()
);

-- ─── KPI REPORTS ─────────────────────────────────────────────────────────────
create table if not exists kpi_reports (
  id          uuid primary key default uuid_generate_v4(),
  model_id    uuid references models(id) on delete cascade,
  report_date date,
  file_url    text,
  analysis    jsonb default '{}',
  created_at  timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table models             enable row level security;
alter table phase_images       enable row level security;
alter table model_profiles     enable row level security;
alter table content_posts      enable row level security;
alter table community_responses enable row level security;
alter table kpi_reports        enable row level security;

-- Allow full access via anon key (internal team tool)
create policy "allow_all" on models              for all to anon using (true) with check (true);
create policy "allow_all" on phase_images        for all to anon using (true) with check (true);
create policy "allow_all" on model_profiles      for all to anon using (true) with check (true);
create policy "allow_all" on content_posts       for all to anon using (true) with check (true);
create policy "allow_all" on community_responses for all to anon using (true) with check (true);
create policy "allow_all" on kpi_reports         for all to anon using (true) with check (true);
