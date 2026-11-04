-- Curbology lives in Opscend's Supabase project for now, so every object here is
-- prefixed curbology_ and nothing touches auth.users triggers. That project's own
-- has_role, handle_new_user and on_auth_user_created belong to Opscend. Profiles
-- are therefore not made by a signup trigger: an admin's row is added on purpose.

-- The publishable key is public and is shared with Opscend's other apps.
revoke all on function public.curbology_log_activity(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.curbology_log_activity(text, text, text, jsonb) to service_role;
revoke all on function public.curbology_claim_admin() from public, anon;

-- Closes claim_admin, which any account in the shared project could otherwise use.
insert into public.curbology_profiles (id, email)
select id, lower(email) from auth.users where lower(email) = 'marcel@opscend.net'
on conflict (id) do nothing;
insert into public.curbology_user_roles (user_id, role)
select id, 'admin'::public.curbology_app_role from auth.users where lower(email) = 'marcel@opscend.net'
on conflict do nothing;
