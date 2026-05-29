-- 1. Cria a tabela de Mensagens (messages) para o chat
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilita RLS na tabela messages
alter table public.messages enable row level security;

-- 3. Cria as políticas de segurança (RLS Policies)
-- Leitura de mensagens permitida apenas para o freelancer ou o autor do job envolvidos no match
create policy "Allow read messages for matched users"
  on public.messages for select
  to authenticated
  using (
    auth.uid() = sender_id or
    auth.uid() in (
      select m.freelancer_id 
      from public.matches m 
      where m.id = match_id
    ) or
    auth.uid() in (
      select j.author_id 
      from public.matches m
      join public.jobs j on j.id = m.job_id
      where m.id = match_id
    )
  );

-- Envio de mensagens permitido apenas se o remetente for ele mesmo e ele fizer parte do match
create policy "Allow insert messages for matched users"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id and (
      auth.uid() in (
        select m.freelancer_id 
        from public.matches m 
        where m.id = match_id
      ) or
      auth.uid() in (
        select j.author_id 
        from public.matches m
        join public.jobs j on j.id = m.job_id
        where m.id = match_id
      )
    )
  );

-- 4. Adiciona a tabela messages à publicação de tempo real do Supabase
alter publication supabase_realtime add table public.messages;
