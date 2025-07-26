import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

export const useBadges = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Voir tous les badges disponibles
  const voirTousLesBadges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('name');

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des badges:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les badges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Vérifier et attribuer automatiquement les badges
  const verifierBadges = async (userId: string) => {
    try {
      // Récupérer le nombre de problèmes résolus
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('problem_id')
        .eq('user_id', userId)
        .eq('verdict', 'Accepted');

      if (submissionsError) throw submissionsError;

      const problemsSolved = new Set(submissions?.map(s => s.problem_id)).size;

      // Définir les seuils de badges
      const badgeThresholds = [
        { name: 'Premier Problème', threshold: 1 },
        { name: 'Novice', threshold: 5 },
        { name: 'Intermédiaire', threshold: 10 },
        { name: 'Expert', threshold: 25 },
        { name: 'Maître', threshold: 50 },
      ];

      // Vérifier quels badges l'utilisateur a déjà
      const { data: existingBadges, error: existingError } = await supabase
        .from('user_badges')
        .select('badge_id, badges(name)')
        .eq('user_id', userId);

      if (existingError) throw existingError;

      const earnedBadgeNames = new Set(existingBadges?.map(ub => ub.badges?.name));

      // Attribuer les nouveaux badges
      for (const { name, threshold } of badgeThresholds) {
        if (problemsSolved >= threshold && !earnedBadgeNames.has(name)) {
          await attribuerBadge(userId, name);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des badges:', error);
    }
  };

  // Attribuer un badge à un utilisateur
  const attribuerBadge = async (userId: string, badgeName: string) => {
    try {
      // Récupérer l'ID du badge
      const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('id')
        .eq('name', badgeName)
        .single();

      if (badgeError || !badge) {
        console.error('Badge non trouvé:', badgeName);
        return;
      }

      // Vérifier si l'utilisateur a déjà ce badge
      const { data: existing, error: existingError } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badge.id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existing) {
        return; // L'utilisateur a déjà ce badge
      }

      // Attribuer le badge
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Nouveau badge!",
        description: `Vous avez obtenu le badge "${badgeName}"!`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'attribution du badge:', error);
    }
  };

  // Récupérer les badges d'un utilisateur
  const getBadgesUtilisateur = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        id: `${item.badge_id}-${userId}`,
        badge_id: item.badge_id,
        earned_at: item.earned_at,
        badges: item.badges
      })) || [];
      
      setUserBadges(formattedData);
      return formattedData;
    } catch (error) {
      console.error('Erreur lors du chargement des badges utilisateur:', error);
      return [];
    }
  };

  useEffect(() => {
    voirTousLesBadges();
  }, []);

  return {
    badges,
    userBadges,
    loading,
    voirTousLesBadges,
    verifierBadges,
    attribuerBadge,
    getBadgesUtilisateur,
  };
};