-- ====================================
-- Digital Paper - Supabase Schema
-- ====================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 既存のテーブルを削除（titleカラムを追加するため）
drop table if exists public.entries cascade;

-- ====================================
-- テーブル: entries (日記エントリ)
-- ====================================
create table public.entries (
  id uuid default uuid_generate_v4() primary key,
  date date not null unique,
  title text default '',
  content text default '',
  mood text default 'neutral',
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- インデックスの作成
create index if not exists entries_date_idx on public.entries(date desc);
create index if not exists entries_created_at_idx on public.entries(created_at desc);

-- ====================================
-- RLS (Row Level Security) の設定
-- ====================================
alter table public.entries enable row level security;

-- すべてのユーザーが全てのエントリを読み取り可能
create policy "Enable read access for all users" on public.entries
  for select using (true);

-- すべてのユーザーが新規エントリを作成可能
create policy "Enable insert for all users" on public.entries
  for insert with check (true);

-- すべてのユーザーがエントリを更新可能
create policy "Enable update for all users" on public.entries
  for update using (true);

-- すべてのユーザーがエントリを削除可能
create policy "Enable delete for all users" on public.entries
  for delete using (true);

-- ====================================
-- 関数: updated_atの自動更新
-- ====================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- トリガーの作成
drop trigger if exists on_entries_updated on public.entries;
create trigger on_entries_updated
  before update on public.entries
  for each row
  execute function public.handle_updated_at();

-- ====================================
-- 関数: 日付範囲でエントリを取得
-- ====================================
create or replace function public.get_entries_by_date_range(
  start_date date,
  end_date date
)
returns setof public.entries as $$
begin
  return query
  select * from public.entries
  where date >= start_date and date <= end_date
  order by date desc;
end;
$$ language plpgsql;
