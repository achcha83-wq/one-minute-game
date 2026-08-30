create table if not exists games (
  id text primary key,
  name text not null,
  html text not null,
  tier smallint not null default 1,
  created_at timestamptz not null default now()
);

alter table games enable row level security;

create policy "Games are publicly readable"
  on games for select
  using (true);

create policy "Games are insertable by service role"
  on games for insert
  with check (true);
