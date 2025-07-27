-- Script SQL à exécuter dans l'interface Supabase SQL Editor
-- Ajouter la colonne contenu à la table participation

ALTER TABLE public.participation 
ADD COLUMN contenu TEXT;

-- Commentaire pour documenter l'usage
COMMENT ON COLUMN public.participation.contenu IS 'Contenu du fichier uploadé par le participant';

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'participation' AND table_schema = 'public'; 