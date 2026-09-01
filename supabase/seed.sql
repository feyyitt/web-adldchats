-- ================================================
-- ADLD CHATS — SEED DATA FOR DEMO USERS
-- Execute this after running schema.sql
-- ================================================

-- 1. Create mock users in auth.users first to satisfy foreign key constraint
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex@adldchats.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"alex_mercer","display_name":"Alex Mercer"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah@adldchats.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"sarah_j","display_name":"Sarah Jenkins"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mike@adldchats.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"mike_ross","display_name":"Mike Ross"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena@adldchats.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"elena_r","display_name":"Elena Rostova"}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david@adldchats.com', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"david_k","display_name":"David Kim"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Seed/Update public.profiles
INSERT INTO public.profiles (id, username, display_name, bio, is_online, ghost_mode) VALUES
  ('00000000-0000-0000-0000-000000000001', 'alex_mercer', 'Alex Mercer', 'Digital explorer | Neon nights | Always online. 🌌', true, false),
  ('00000000-0000-0000-0000-000000000002', 'sarah_j', 'Sarah Jenkins', 'Living in synthwave tempo 🎵', true, false),
  ('00000000-0000-0000-0000-000000000003', 'mike_ross', 'Mike Ross', 'Night driver & code breaker 🚗', false, false),
  ('00000000-0000-0000-0000-000000000004', 'elena_r', 'Elena Rostova', 'Cyberpunk aesthetic enthusiast ✨', true, false),
  ('00000000-0000-0000-0000-000000000005', 'david_k', 'David Kim', 'Exploring Neo-Tokyo rooftops 🏙️', false, true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  is_online = EXCLUDED.is_online;
