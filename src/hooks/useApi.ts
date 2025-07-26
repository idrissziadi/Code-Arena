import { supabase } from '@/integrations/supabase/client';

export const useApi = () => {
  const executeCode = async (code: string, language: string, input: string = '') => {
    const { data, error } = await supabase.functions.invoke('execute-code', {
      body: { code, language, input }
    });

    if (error) {
      console.error('Execute code error:', error);
      throw new Error(error.message || 'Erreur lors de l\'exécution du code');
    }
    return data;
  };

  const getUserStats = async () => {
    const { data, error } = await supabase.functions.invoke('user-stats');
    if (error) throw error;
    return data;
  };

  const submitSolution = async (problemId: string, code: string, languageId: string) => {
    const { data, error } = await supabase.functions.invoke('submit-solution', {
      body: { problemId, code, languageId }
    });

    if (error) {
      console.error('Submit solution error:', error);
      throw new Error(error.message || 'Erreur lors de la soumission');
    }
    return data;
  };

  const getAdminDashboard = async (action: string) => {
    const { data, error } = await supabase.functions.invoke('admin-dashboard', {
      body: {},
      method: 'GET',
    });

    if (error) throw error;
    return data;
  };

  const moderateContent = async (type: string, id: string, action: string, reason?: string) => {
    const { data, error } = await supabase.functions.invoke('moderate-content', {
      body: { type, id, action, reason }
    });

    if (error) throw error;
    return data;
  };

  return {
    executeCode,
    getUserStats,
    submitSolution,
    getAdminDashboard,
    moderateContent,
  };
};