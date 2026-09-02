-- Creates a sign-in-capable test user.
-- Email: user@example.com
-- Password: password

create extension if not exists pgcrypto;

do $$
declare
  user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
begin
  if exists (select 1 from auth.users where id = user_id) then
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    'user@example.com',
    crypt('password', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

  insert into auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    user_id,
    'email',
    user_id::text,
    jsonb_build_object('sub', user_id::text, 'email', 'user@example.com'),
    now(),
    now(),
    now()
  );
end $$;
