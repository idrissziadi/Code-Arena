-- Script SQL à exécuter dans l'interface Supabase SQL Editor
-- Création de la fonction calculate_user_rank pour calculer le classement réel des utilisateurs

CREATE OR REPLACE FUNCTION calculate_user_rank(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    -- Calculer le classement basé sur le nombre de problèmes résolus
    -- Les utilisateurs avec plus de problèmes résolus ont un meilleur classement (rang plus petit)
    SELECT rank_position INTO user_rank
    FROM (
        SELECT 
            u.id,
            ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT s.problem_id) DESC, u.created_at ASC) as rank_position
        FROM users u
        LEFT JOIN submissions s ON u.id = s.user_id AND s.verdict = 'Accepted'
        GROUP BY u.id, u.created_at
    ) ranked_users
    WHERE id = user_id;
    
    -- Retourner le classement ou 1 si l'utilisateur n'est pas trouvé
    RETURN COALESCE(user_rank, 1);
END;
$$;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION calculate_user_rank(UUID) IS 'Calcule le classement d''un utilisateur basé sur le nombre de problèmes résolus';

-- Test de la fonction (optionnel)
-- SELECT calculate_user_rank('your-user-id-here'); 