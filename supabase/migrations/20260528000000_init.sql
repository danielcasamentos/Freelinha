-- 1. Habilita a extensão UUID
create extension if not exists "uuid-ossp";

-- 2. Cria a tabela de Perfis Públicos (profiles)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  phone text not null,
  city text not null,
  state text not null,
  country text not null,
  username text unique not null,
  avatar_url text,
  role text default 'Produtor',
  is_pro boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Cria a tabela de Perfis Profissionais para Freelancers (freelancer_profiles)
create table public.freelancer_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  bio text default '',
  funcoes text[] default '{}'::text[],
  specialties text[] default '{}'::text[],
  portfolio_links jsonb default '{}'::jsonb,
  min_price numeric default 0,
  max_price numeric default 0,
  currency text default 'BRL',
  disponibilidade text default 'Disponível',
  rate numeric default 5.0,
  jobs_count integer default 0,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Cria a tabela de Vagas (jobs)
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null,
  role text not null,
  location text not null,
  latitude double precision,
  longitude double precision,
  value text not null,
  description text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'Open'::text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Cria a tabela de Interesse/Match (matches)
create table public.matches (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  freelancer_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'Pending'::text not null, -- 'Pending', 'Accepted', 'Rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (job_id, freelancer_id)
);

-- 6. Habilita Row Level Security (RLS) para segurança das tabelas
alter table public.profiles enable row level security;
alter table public.freelancer_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.matches enable row level security;

-- 7. Criação das políticas de segurança (RLS Policies)

-- PERFIS (profiles):
-- Leitura pública para usuários autenticados
create policy "Allow public read for authenticated profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Atualização permitida apenas ao dono do perfil
create policy "Allow owners to update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- PROFISSIONAIS (freelancer_profiles):
-- Leitura pública para usuários autenticados
create policy "Allow public read for freelancer profiles"
  on public.freelancer_profiles for select
  to authenticated
  using (true);

-- Inserção/Atualização pelo próprio dono
create policy "Allow owners to insert freelancer profiles"
  on public.freelancer_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Allow owners to update freelancer profiles"
  on public.freelancer_profiles for update
  to authenticated
  using (auth.uid() = id);

-- VAGAS (jobs):
-- Leitura pública das vagas ativas/abertas para autenticados
create policy "Allow read for jobs"
  on public.jobs for select
  to authenticated
  using (true);

-- Qualquer usuário autenticado pode criar vagas
create policy "Allow authenticated users to create jobs"
  on public.jobs for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Somente o autor pode modificar ou deletar a vaga
create policy "Allow authors to update/delete jobs"
  on public.jobs for update
  to authenticated
  using (auth.uid() = author_id);

create policy "Allow authors to delete jobs"
  on public.jobs for delete
  to authenticated
  using (auth.uid() = author_id);

-- MATCHES:
-- Leitura de matches para quem publicou a vaga ou quem se interessou
create policy "Allow read matches for involved users"
  on public.matches for select
  to authenticated
  using (
    auth.uid() = freelancer_id or 
    auth.uid() in (select author_id from public.jobs where id = job_id)
  );

-- Freelancers autenticados podem manifestar interesse (criar match)
create policy "Allow freelancers to manifest interest"
  on public.matches for insert
  to authenticated
  with check (auth.uid() = freelancer_id);

-- Somente o criador da vaga ou o próprio freelancer interessado pode atualizar o status (ex: aceitar ou cancelar)
create policy "Allow updates to matches for involved users"
  on public.matches for update
  to authenticated
  using (
    auth.uid() = freelancer_id or 
    auth.uid() in (select author_id from public.jobs where id = job_id)
  );

-- 8. Função e Trigger para criar o perfil público automaticamente no Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    first_name,
    last_name,
    phone,
    city,
    state,
    country,
    username,
    avatar_url,
    role,
    is_pro
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Nome'),
    coalesce(new.raw_user_meta_data->>'last_name', 'Sobrenome'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'city', 'São Paulo'),
    coalesce(new.raw_user_meta_data->>'state', 'SP'),
    coalesce(new.raw_user_meta_data->>'country', 'Brasil'),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://picsum.photos/200/200?random=' || floor(random() * 100)::text),
    coalesce(new.raw_user_meta_data->>'role', 'Produtor'),
    false
  );

  -- Se for um freelancer ou registrar cargo profissional, já cria a entrada base dele na freelancer_profiles
  insert into public.freelancer_profiles (id, bio, funcoes)
  values (new.id, 'Olá! Sou um profissional do audiovisual.', array[coalesce(new.raw_user_meta_data->>'role', 'Produtor')]);

  return new;
end;
$$ language plpgsql security definer;

-- Gatilho associado ao Supabase Auth
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
