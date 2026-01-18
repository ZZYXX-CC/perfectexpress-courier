-- Create Admin User Script
-- Run this in Supabase SQL Editor

-- Ensure extensions are enabled
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

DO $$
DECLARE
  target_email text := 'miguelkwan56@gmail.com';
  target_password text := '11223344';
  target_user_id uuid;
BEGIN
  -- 1. Check if user already exists
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    -- 2. Create new user if not exists
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      target_email,
      crypt(target_password, gen_salt('bf')),
      now(), -- Auto-confirm email
      '{"provider":"email","providers":["email"]}',
      '{"full_name": "Admin User"}',
      now(),
      now()
    ) RETURNING id INTO target_user_id;
    
    RAISE NOTICE 'User created: %', target_email;
  ELSE
    -- 3. Update password if user exists
    UPDATE auth.users 
    SET encrypted_password = crypt(target_password, gen_salt('bf'))
    WHERE id = target_user_id;
    
    RAISE NOTICE 'User password updated: %', target_email;
  END IF;

  -- 4. Ensure profile exists and has admin role
  -- Note: The trigger 'on_auth_user_created' might have created the profile with 'user' role.
  -- We use ON CONFLICT to update it to 'admin' regardless.
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (target_user_id, 'Admin User', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

  RAISE NOTICE 'User role set to ADMIN';

END $$;
