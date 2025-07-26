/*
  # Créer un utilisateur administrateur

  1. Insertion d'un utilisateur admin
    - Email: admin@codearena.com
    - Mot de passe: AdminCodeArena2024!
    - Rôle: admin
    - Username: admin

  2. Configuration
    - Utilisateur avec tous les privilèges d'administration
    - Accès complet au panel d'administration
    - Compte vérifié et actif

  Note: Cet utilisateur doit être créé manuellement dans Supabase Auth
  puis lié dans la table users avec ce script.
*/

-- Insérer l'utilisateur admin dans la table users
-- L'ID doit correspondre à celui créé dans Supabase Auth
INSERT INTO users (
  id,
  username,
  email,
  role,
  avatar,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- ID temporaire, à remplacer par l'ID réel de Supabase Auth
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

-- Insérer quelques structures de données par défaut
INSERT INTO data_structures (name, description) VALUES
  ('Tableau', 'Structure de données linéaire avec accès indexé'),
  ('Liste Chaînée', 'Structure de données dynamique avec pointeurs'),
  ('Pile', 'Structure LIFO (Last In, First Out)'),
  ('File', 'Structure FIFO (First In, First Out)'),
  ('Arbre Binaire', 'Structure hiérarchique avec au plus deux enfants par nœud'),
  ('Graphe', 'Structure de données avec nœuds et arêtes'),
  ('Table de Hachage', 'Structure associative clé-valeur'),
  ('Tas', 'Arbre binaire complet avec propriété d''ordre')
ON CONFLICT (name) DO NOTHING;

-- Insérer quelques langages de programmation
INSERT INTO languages (name) VALUES
  ('Python'),
  ('JavaScript'),
  ('Java'),
  ('C++'),
  ('C'),
  ('Go'),
  ('Rust'),
  ('TypeScript'),
  ('C#'),
  ('PHP'),
  ('Ruby'),
  ('Swift'),
  ('Kotlin')
ON CONFLICT (name) DO NOTHING;

-- Insérer quelques badges par défaut
INSERT INTO badges (name, icon, description) VALUES
  ('First Blood', '🩸', 'Premier problème résolu'),
  ('Problem Solver', '🧩', '10 problèmes résolus'),
  ('Code Master', '👨‍💻', '50 problèmes résolus'),
  ('Algorithm Expert', '🎯', '100 problèmes résolus'),
  ('Speed Demon', '⚡', 'Solution en moins de 100ms'),
  ('Memory Efficient', '💾', 'Solution utilisant moins de 1MB'),
  ('Contest Winner', '🏆', 'Victoire dans un concours'),
  ('Community Helper', '🤝', '10 solutions expliquées')
ON CONFLICT (name) DO NOTHING;