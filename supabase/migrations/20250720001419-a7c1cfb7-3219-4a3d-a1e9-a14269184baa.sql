-- Créer un utilisateur admin dans Supabase Auth et la table users
-- Insérer l'utilisateur admin avec un ID fixe pour faciliter les tests
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@codearena.com',
  crypt('AdminCodeArena2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "admin"}',
  false,
  '',
  '',
  '',
  ''
);

-- Insérer l'utilisateur admin dans la table users publique
INSERT INTO public.users (
  id,
  username,
  email,
  role,
  avatar,
  created_at
) VALUES (
  'admin-0000-0000-0000-000000000001',
  'admin',
  'admin@codearena.com',
  'admin',
  'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
  now()
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  avatar = EXCLUDED.avatar;