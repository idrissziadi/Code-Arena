-- Migration : Création de la table commentsolution pour les commentaires sur les solutions
CREATE TABLE public.commentsolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  solution_id uuid REFERENCES public.solutions(id) ON DELETE CASCADE,
  is_reported BOOLEAN DEFAULT FALSE
);

-- Index pour accélérer les requêtes par solution
CREATE INDEX idx_commentsolution_solution_id ON public.commentsolution(solution_id);
