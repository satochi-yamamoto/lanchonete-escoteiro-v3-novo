-- Security fix: PINs were stored and compared in plaintext, and RLS allowed
-- anon to SELECT the pin column directly (full credential exfiltration).
-- This migration hashes PINs, adds brute-force lockout, and moves
-- authentication/PIN management behind SECURITY DEFINER functions so the
-- raw pin/pin_hash never needs to be readable by anon/authenticated.

create extension if not exists pgcrypto;

alter table public.users add column if not exists pin_hash text;
alter table public.users add column if not exists failed_pin_attempts int not null default 0;
alter table public.users add column if not exists pin_locked_until timestamptz;

-- Backfill hashes from the existing plaintext column, then drop it.
update public.users set pin_hash = crypt(pin, gen_salt('bf')) where pin_hash is null and pin is not null;
alter table public.users drop column if exists pin;

-- Column-level lockdown: block direct reads of pin_hash via PostgREST/table
-- queries even though row-level policies remain permissive for this
-- single-terminal deployment. Only id/name/role (+ lockout bookkeeping) stay
-- readable; pin_hash is only ever touched inside the SECURITY DEFINER
-- functions below, which run with the table owner's privileges.
revoke select on public.users from anon, authenticated;
grant select (id, name, role, failed_pin_attempts, pin_locked_until) on public.users to anon, authenticated;
revoke insert (pin_hash), update (pin_hash) on public.users from anon, authenticated;

create or replace function public.authenticate_user_by_pin(p_user_id uuid, p_pin text)
returns table(id uuid, name text, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select u.id, u.name, u.role, u.pin_hash, u.failed_pin_attempts, u.pin_locked_until
    into rec
    from public.users u
    where u.id = p_user_id;

  if not found then
    return;
  end if;

  if rec.pin_locked_until is not null and rec.pin_locked_until > now() then
    return;
  end if;

  if rec.pin_hash is not null and crypt(p_pin, rec.pin_hash) = rec.pin_hash then
    update public.users set failed_pin_attempts = 0, pin_locked_until = null where public.users.id = p_user_id;
    return query select rec.id, rec.name, rec.role;
    return;
  end if;

  update public.users
    set failed_pin_attempts = failed_pin_attempts + 1,
        pin_locked_until = case when failed_pin_attempts + 1 >= 5 then now() + interval '15 minutes' else pin_locked_until end
    where public.users.id = p_user_id;

  return;
end;
$$;

grant execute on function public.authenticate_user_by_pin(uuid, text) to anon, authenticated;

-- Admin "set/reset PIN" flow. Never returns or exposes the hash.
create or replace function public.set_user_pin(p_user_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin !~ '^\d{4}$' then
    raise exception 'PIN inválido: deve ter 4 dígitos';
  end if;

  update public.users
    set pin_hash = crypt(p_pin, gen_salt('bf')),
        failed_pin_attempts = 0,
        pin_locked_until = null
    where id = p_user_id;
end;
$$;

grant execute on function public.set_user_pin(uuid, text) to anon, authenticated;
