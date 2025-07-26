import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  email: boolean;
  desktop: boolean;
  contests: boolean;
  achievements: boolean;
}

export function useNotifications() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    desktop: false,
    contests: true,
    achievements: true,
  });

  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('notification-preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Non supporté",
        description: "Les notifications ne sont pas supportées par ce navigateur",
        variant: "destructive"
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast({
        title: "Notifications activées",
        description: "Vous recevrez maintenant des notifications de bureau"
      });
      return true;
    } else {
      toast({
        title: "Notifications refusées",
        description: "Vous pouvez les activer dans les paramètres de votre navigateur",
        variant: "destructive"
      });
      return false;
    }
  };

  const updatePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notification-preferences', JSON.stringify(newPreferences));
    
    toast({
      title: "Préférences sauvegardées",
      description: "Vos préférences de notification ont été mises à jour"
    });
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!preferences.desktop || permission !== 'granted') {
      return;
    }

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const notifyNewContest = (contestTitle: string) => {
    if (preferences.contests) {
      showNotification('Nouveau concours disponible !', {
        body: `Le concours "${contestTitle}" vient de commencer`,
        tag: 'contest'
      });
    }
  };

  const notifyNewBadge = (badgeName: string) => {
    if (preferences.achievements) {
      showNotification('Nouveau badge débloqué !', {
        body: `Félicitations ! Vous avez obtenu le badge "${badgeName}"`,
        tag: 'achievement'
      });
    }
  };

  const notifySubmissionResult = (verdict: string, problemTitle: string) => {
    if (preferences.desktop) {
      const isSuccess = verdict === 'Accepted';
      showNotification(
        isSuccess ? 'Solution acceptée !' : 'Solution rejetée',
        {
          body: `Votre solution pour "${problemTitle}" : ${verdict}`,
          tag: 'submission'
        }
      );
    }
  };

  return {
    preferences,
    permission,
    requestPermission,
    updatePreferences,
    showNotification,
    notifyNewContest,
    notifyNewBadge,
    notifySubmissionResult,
  };
}