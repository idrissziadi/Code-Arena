import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Solution {
  id: string;
  explanation: string;
  validated: boolean;
  created_at: string;
  user_id: string;
  problem_id: string;
  submission_id: string;
  users?: {
    username: string;
    avatar: string;
  };
  problems?: {
    title: string;
    difficulty: string;
  };
  submissions?: {
    code: string;
    verdict: string;
    languages?: {
      name: string;
    };
  };
}

export const useSolutions = () => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Proposer une solution (utilisateur)
  const proposerSolution = async (
    problemId: string, 
    submissionId: string, 
    explanation: string,
    userId: string
  ) => {
    setLoading(true);
    try {
      // Vérifier que la soumission a le verdict "Accepted"
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('verdict')
        .eq('id', submissionId)
        .eq('user_id', userId)
        .single();

      if (submissionError) throw submissionError;

      if (submission.verdict !== 'Accepted') {
        toast({
          title: "Erreur",
          description: "Vous ne pouvez proposer une solution que pour une soumission acceptée",
          variant: "destructive",
        });
        return false;
      }

      // Vérifier s'il n'y a pas déjà une solution pour cette soumission
      const { data: existingSolution, error: existingError } = await supabase
        .from('solutions')
        .select('id')
        .eq('submission_id', submissionId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingSolution) {
        toast({
          title: "Erreur",
          description: "Une solution a déjà été proposée pour cette soumission",
          variant: "destructive",
        });
        return false;
      }

      // Créer la solution
      const { error } = await supabase
        .from('solutions')
        .insert({
          user_id: userId,
          problem_id: problemId,
          submission_id: submissionId,
          explanation,
          validated: false,
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Solution proposée avec succès! Elle sera validée par un administrateur.",
      });

      await voirSolutions();
      return true;
    } catch (error) {
      console.error('Erreur lors de la proposition de solution:', error);
      toast({
        title: "Erreur",
        description: "Impossible de proposer la solution",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Voir toutes les solutions (avec option de filtrer par validation)
  const voirSolutions = async (validatedOnly: boolean = false) => {
    setLoading(true);
    try {
      let query = supabase
        .from('solutions')
        .select(`
          id,
          explanation,
          validated,
          created_at,
          user_id,
          problem_id,
          submission_id,
          users (
            username,
            avatar
          ),
          problems (
            title,
            difficulty
          ),
          submissions (
            code,
            verdict,
            languages (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (validatedOnly) {
        query = query.eq('validated', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSolutions(data || []);
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des solutions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les solutions",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Valider une solution (admin)
  const validerSolution = async (solutionId: string) => {
    try {
      const { error } = await supabase
        .from('solutions')
        .update({ validated: true })
        .eq('id', solutionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Solution validée avec succès",
      });

      await voirSolutions();
      return true;
    } catch (error) {
      console.error('Erreur lors de la validation de la solution:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider la solution",
        variant: "destructive",
      });
      return false;
    }
  };

  // Supprimer une solution (admin)
  const supprimerSolution = async (solutionId: string) => {
    try {
      const { error } = await supabase
        .from('solutions')
        .delete()
        .eq('id', solutionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Solution supprimée avec succès",
      });

      await voirSolutions();
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la solution:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la solution",
        variant: "destructive",
      });
      return false;
    }
  };

  // Récupérer les solutions d'un problème spécifique
  const getSolutionsPourProbleme = async (problemId: string) => {
    try {
      const { data, error } = await supabase
        .from('solutions')
        .select(`
          id,
          explanation,
          validated,
          created_at,
          user_id,
          users (
            username,
            avatar
          ),
          submissions (
            code,
            languages (
              name
            )
          )
        `)
        .eq('problem_id', problemId)
        .eq('validated', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des solutions pour le problème:', error);
      return [];
    }
  };

  // Vérifier si l'utilisateur peut proposer une solution pour une soumission
  const peutProposerSolution = async (submissionId: string, userId: string) => {
    try {
      console.log(`🔍 Checking if user ${userId} can propose solution for submission ${submissionId}`);
      
      // Vérifier que la soumission appartient à l'utilisateur et est acceptée
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('verdict, user_id')
        .eq('id', submissionId)
        .single();

      console.log('📝 Submission data:', submission);
      if (submissionError) {
        console.error('❌ Submission error:', submissionError);
        return false;
      }

      if (submission.user_id !== userId || submission.verdict !== 'Accepted') {
        console.log('❌ User mismatch or not accepted:', { 
          userMatch: submission.user_id === userId, 
          isAccepted: submission.verdict === 'Accepted' 
        });
        return false;
      }

      // Vérifier qu'il n'y a pas déjà une solution pour cette soumission
      const { data: existingSolution, error: existingError } = await supabase
        .from('solutions')
        .select('id')
        .eq('submission_id', submissionId)
        .single();

      console.log('🔍 Existing solution check:', { existingSolution, existingError });

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('❌ Error checking existing solution:', existingError);
        return false;
      }

      const canPropose = !existingSolution;
      console.log(`✅ Can propose solution: ${canPropose}`);
      return canPropose;
    } catch (error) {
      console.error('❌ Error in peutProposerSolution:', error);
      return false;
    }
  };

  useEffect(() => {
    voirSolutions(true); // Charger seulement les solutions validées par défaut
  }, []);

  return {
    solutions,
    loading,
    proposerSolution,
    voirSolutions,
    validerSolution,
    supprimerSolution,
    getSolutionsPourProbleme,
    peutProposerSolution,
  };
};