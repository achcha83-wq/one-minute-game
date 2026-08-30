create table if not exists games (
  id text primary key,
  name text not null,
  html text not null,
  tier smallint not null default 1,
  high_score integer not null default 0,
  created_at timestamptz not null default now()
);

alter table games enable row level security;

create policy "Games are publicly readable"
  on games for select
  using (true);

create policy "Games are insertable by service role"
  on games for insert
  with check (true);

create policy "Games are updatable by service role"
  on games for update
  using (true);

-- Pre-generated game pool: games waiting to be served
create table if not exists game_pool (
  id text primary key,
  name text not null,
  html text not null,
  tier smallint not null,
  created_at timestamptz not null default now()
);

alter table game_pool enable row level security;

create policy "Pool readable by service role"
  on game_pool for select using (true);

create policy "Pool insertable by service role"
  on game_pool for insert with check (true);

create policy "Pool deletable by service role"
  on game_pool for delete using (true);
