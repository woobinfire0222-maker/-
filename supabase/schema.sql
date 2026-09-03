-- 돼홍존위 Supabase schema
-- Run this entire file in Supabase SQL Editor before using the app.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('member', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.member_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.meeting_status as enum ('scheduled', 'active', 'ended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('announcement', 'meeting', 'system', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.coin_transaction_type as enum ('add', 'remove');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  role public.app_role not null default 'member',
  status public.member_status not null default 'active',
  coin_balance integer not null default 0 check (coin_balance >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  content text not null check (char_length(trim(content)) between 1 and 20000),
  author_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.emergency_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  status public.meeting_status not null default 'scheduled',
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  ended_at timestamptz,
  constraint meeting_times_valid check (
    (status = 'scheduled' and started_at is null and ended_at is null)
    or (status = 'active' and started_at is not null and ended_at is null)
    or (status = 'ended' and started_at is not null and ended_at is not null)
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  content text not null default '' check (char_length(content) <= 2000),
  type public.notification_type not null default 'system',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.profiles(id) on delete restrict,
  previous_balance integer not null check (previous_balance >= 0),
  amount_changed integer not null check (amount_changed <> 0),
  new_balance integer not null check (new_balance >= 0),
  transaction_type public.coin_transaction_type not null,
  reason text not null check (char_length(trim(reason)) between 1 and 500),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint transaction_type_matches_amount check (
    (transaction_type = 'add' and amount_changed > 0)
    or (transaction_type = 'remove' and amount_changed < 0)
  ),
  constraint transaction_balance_delta check (new_balance = previous_balance + amount_changed)
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action_type text not null check (char_length(trim(action_type)) between 1 and 80),
  target_user_id uuid references public.profiles(id) on delete set null,
  description text not null check (char_length(trim(description)) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists announcements_created_at_idx on public.announcements (created_at desc);
create index if not exists chat_messages_room_created_at_idx on public.chat_messages (room_id, created_at);
create index if not exists emergency_meetings_status_created_at_idx on public.emergency_meetings (status, created_at desc);
create index if not exists notifications_user_created_at_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id, read_at) where read_at is null;
create index if not exists coin_transactions_target_created_at_idx on public.coin_transactions (target_user_id, created_at desc);
create index if not exists admin_logs_created_at_idx on public.admin_logs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at before update on public.announcements
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'::public.app_role
      and status = 'active'::public.member_status
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_name text;
begin
  requested_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(requested_name, split_part(coalesce(new.email, '회원'), '@', 1), '회원')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prevent_member_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id <> old.id
      or new.email <> old.email
      or new.role <> old.role
      or new.status <> old.status
      or new.coin_balance <> old.coin_balance then
      raise exception '권한이 없는 필드입니다';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileged_fields on public.profiles;
create trigger profiles_protect_privileged_fields before update on public.profiles
for each row execute function public.prevent_member_privilege_changes();

create or replace function public.log_profile_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role) or (new.status is distinct from old.status) then
    insert into public.admin_logs (admin_id, action_type, target_user_id, description)
    values (
      auth.uid(),
      case when new.role is distinct from old.role then 'role_changed' else 'member_status_changed' end,
      new.id,
      case
        when new.role is distinct from old.role then format('회원 권한을 %s에서 %s로 변경했습니다.', old.role, new.role)
        else format('회원 상태를 %s에서 %s로 변경했습니다.', old.status, new.status)
      end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_log_admin_change on public.profiles;
create trigger profiles_log_admin_change after update on public.profiles
for each row execute function public.log_profile_admin_change();

create or replace function public.create_user_notifications(
  notification_title text,
  notification_content text,
  notification_type public.notification_type
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, title, content, type)
  select id, notification_title, notification_content, notification_type
  from public.profiles
  where status = 'active'::public.member_status;
$$;

revoke all on function public.create_user_notifications(text, text, public.notification_type) from public;
grant execute on function public.create_user_notifications(text, text, public.notification_type) to authenticated;

create or replace function public.notify_new_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_user_notifications(
    '새 공지사항이 등록되었습니다',
    new.title,
    'announcement'::public.notification_type
  );
  return new;
end;
$$;

drop trigger if exists announcements_notify_members on public.announcements;
create trigger announcements_notify_members after insert on public.announcements
for each row execute function public.notify_new_announcement();

create or replace function public.notify_meeting_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.create_user_notifications(
      '긴급회의가 등록되었습니다',
      new.title,
      'meeting'::public.notification_type
    );
  elsif new.status is distinct from old.status and new.status = 'active'::public.meeting_status then
    perform public.create_user_notifications(
      '긴급회의가 시작되었습니다',
      new.title,
      'meeting'::public.notification_type
    );
  elsif new.status is distinct from old.status and new.status = 'ended'::public.meeting_status then
    perform public.create_user_notifications(
      '긴급회의가 종료되었습니다',
      new.title,
      'meeting'::public.notification_type
    );
  end if;
  return new;
end;
$$;

drop trigger if exists meetings_notify_members on public.emergency_meetings;
create trigger meetings_notify_members after insert or update on public.emergency_meetings
for each row execute function public.notify_meeting_status();

create or replace function public.adjust_user_coins(
  target_id uuid,
  change_amount integer,
  change_reason text
)
returns public.coin_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  previous integer;
  next_balance integer;
  created_transaction public.coin_transactions;
begin
  if not public.is_admin() then
    raise exception '관리자만 코인을 변경할 수 있습니다';
  end if;
  if change_amount = 0 then
    raise exception '변경 코인은 0이 될 수 없습니다';
  end if;
  if change_reason is null or char_length(trim(change_reason)) = 0 then
    raise exception '변경 사유를 입력해 주세요';
  end if;

  select coin_balance into previous
  from public.profiles
  where id = target_id and status = 'active'::public.member_status
  for update;

  if previous is null then
    raise exception '대상 회원을 찾을 수 없습니다';
  end if;

  next_balance := previous + change_amount;
  if next_balance < 0 then
    raise exception '보유 코인보다 많이 차감할 수 없습니다';
  end if;

  update public.profiles
  set coin_balance = next_balance, updated_at = timezone('utc', now())
  where id = target_id;

  insert into public.coin_transactions (
    target_user_id, previous_balance, amount_changed, new_balance,
    transaction_type, reason, admin_id
  )
  values (
    target_id, previous, change_amount, next_balance,
    case when change_amount > 0 then 'add' else 'remove' end,
    trim(change_reason), auth.uid()
  )
  returning * into created_transaction;

  insert into public.admin_logs (admin_id, action_type, target_user_id, description)
  values (
    auth.uid(),
    case when change_amount > 0 then 'coin_added' else 'coin_removed' end,
    target_id,
    format('%s코인: %s', change_amount, trim(change_reason))
  );

  return created_transaction;
end;
$$;

revoke all on function public.adjust_user_coins(uuid, integer, text) from public;
grant execute on function public.adjust_user_coins(uuid, integer, text) to authenticated;

create or replace function public.send_global_notification(
  notification_title text,
  notification_content text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if not public.is_admin() then
    raise exception '관리자만 전체 알림을 보낼 수 있습니다';
  end if;
  if notification_title is null or char_length(trim(notification_title)) = 0 then
    raise exception '알림 제목을 입력해 주세요';
  end if;

  insert into public.notifications (user_id, title, content, type)
  select id, trim(notification_title), coalesce(notification_content, ''), 'admin'
  from public.profiles
  where status = 'active'::public.member_status;
  get diagnostics inserted_count = row_count;

  insert into public.admin_logs (admin_id, action_type, description)
  values (auth.uid(), 'global_notification_sent', format('전체 회원 %s명에게 알림을 보냈습니다.', inserted_count));
  return inserted_count;
end;
$$;

revoke all on function public.send_global_notification(text, text) from public;
grant execute on function public.send_global_notification(text, text) to authenticated;

create or replace function public.log_announcement_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_logs (admin_id, action_type, description)
  values (auth.uid(), 'announcement_deleted', format('공지사항을 삭제했습니다: %s', old.title));
  return old;
end;
$$;

drop trigger if exists announcements_log_delete on public.announcements;
create trigger announcements_log_delete after delete on public.announcements
for each row execute function public.log_announcement_delete();

create or replace function public.log_announcement_admin_create()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_logs (admin_id, action_type, description)
  values (auth.uid(), 'announcement_created', format('공지사항을 등록했습니다: %s', new.title));
  return new;
end;
$$;

drop trigger if exists announcements_log_create on public.announcements;
create trigger announcements_log_create after insert on public.announcements
for each row execute function public.log_announcement_admin_create();

create or replace function public.log_meeting_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_logs (admin_id, action_type, description)
    values (auth.uid(), 'emergency_meeting_created', format('긴급회의를 개설했습니다: %s', new.title));
  elsif new.status is distinct from old.status and new.status = 'ended'::public.meeting_status then
    insert into public.admin_logs (admin_id, action_type, description)
    values (auth.uid(), 'emergency_meeting_ended', format('긴급회의를 종료했습니다: %s', new.title));
  end if;
  return new;
end;
$$;

drop trigger if exists meetings_log_admin_change on public.emergency_meetings;
create trigger meetings_log_admin_change after insert or update on public.emergency_meetings
for each row execute function public.log_meeting_admin_change();

-- Seed one shared chat room. This is structural seed data, not mock activity.
insert into public.chat_rooms (name, description)
select '전체 대화방', '모든 회원이 함께 이야기하는 공간입니다.'
where not exists (select 1 from public.chat_rooms);

alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;
alter table public.emergency_meetings enable row level security;
alter table public.notifications enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.admin_logs enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "announcements_select_active_members" on public.announcements;
create policy "announcements_select_active_members" on public.announcements for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'::public.member_status));

drop policy if exists "announcements_admin_insert" on public.announcements;
create policy "announcements_admin_insert" on public.announcements for insert to authenticated
with check (public.is_admin() and author_id = auth.uid());

drop policy if exists "announcements_admin_update" on public.announcements;
create policy "announcements_admin_update" on public.announcements for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "announcements_admin_delete" on public.announcements;
create policy "announcements_admin_delete" on public.announcements for delete to authenticated
using (public.is_admin());

drop policy if exists "chat_rooms_active_members_read" on public.chat_rooms;
create policy "chat_rooms_active_members_read" on public.chat_rooms for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'::public.member_status));

drop policy if exists "chat_rooms_admin_manage" on public.chat_rooms;
create policy "chat_rooms_admin_manage" on public.chat_rooms for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "chat_messages_active_members_read" on public.chat_messages;
create policy "chat_messages_active_members_read" on public.chat_messages for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'::public.member_status));

drop policy if exists "chat_messages_self_insert" on public.chat_messages;
create policy "chat_messages_self_insert" on public.chat_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'::public.member_status)
);

drop policy if exists "chat_messages_admin_delete" on public.chat_messages;
create policy "chat_messages_admin_delete" on public.chat_messages for delete to authenticated
using (public.is_admin());

drop policy if exists "meetings_active_members_read" on public.emergency_meetings;
create policy "meetings_active_members_read" on public.emergency_meetings for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'::public.member_status));

drop policy if exists "meetings_admin_manage" on public.emergency_meetings;
drop policy if exists "meetings_admin_insert" on public.emergency_meetings;
create policy "meetings_admin_insert" on public.emergency_meetings for insert to authenticated
with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "meetings_admin_update" on public.emergency_meetings;
create policy "meetings_admin_update" on public.emergency_meetings for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "meetings_admin_delete" on public.emergency_meetings;
create policy "meetings_admin_delete" on public.emergency_meetings for delete to authenticated
using (public.is_admin());

drop policy if exists "notifications_self_read" on public.notifications;
create policy "notifications_self_read" on public.notifications for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_self_mark_read" on public.notifications;
create policy "notifications_self_mark_read" on public.notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert" on public.notifications for insert to authenticated
with check (public.is_admin());

drop policy if exists "coin_transactions_self_or_admin_read" on public.coin_transactions;
create policy "coin_transactions_self_or_admin_read" on public.coin_transactions for select to authenticated
using (target_user_id = auth.uid() or public.is_admin());

drop policy if exists "admin_logs_admin_read" on public.admin_logs;
create policy "admin_logs_admin_read" on public.admin_logs for select to authenticated
using (public.is_admin());

-- No direct client INSERT/UPDATE/DELETE policies exist for immutable ledgers.
revoke all on public.coin_transactions from anon, authenticated;
grant select on public.coin_transactions to authenticated;
revoke all on public.admin_logs from anon, authenticated;
grant select on public.admin_logs to authenticated;

-- Enable database change events for the browser subscriptions.
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.emergency_meetings;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;