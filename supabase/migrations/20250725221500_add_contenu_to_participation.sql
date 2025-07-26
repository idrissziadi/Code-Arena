-- Migration : Ajout de la colonne contenu à la table participation
ALTER TABLE public.participation 
ADD COLUMN contenu TEXT;

-- Commentaire pour documenter l'usage
COMMENT ON COLUMN public.participation.contenu IS 'Contenu du fichier uploadé par le participant';
