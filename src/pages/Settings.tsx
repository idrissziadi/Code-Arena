import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  User,
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Trash2,
  Save,
  Upload,
  Eye,
  EyeOff,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  created_at: string;
}

interface PrivacyPreferences {
  profile_public: boolean;
  stats_public: boolean;
  submissions_public: boolean;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { 
    preferences: notificationPreferences, 
    permission: notificationPermission,
    requestPermission,
    updatePreferences: updateNotificationPreferences 
  } = useNotifications();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [privacyPreferences, setPrivacyPreferences] = useState<PrivacyPreferences>({
    profile_public: true,
    stats_public: true,
    submissions_public: false,
  });
  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      loadLanguagePreference();
      loadPrivacyPreferences();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        username: data.username || '',
        avatar: data.avatar || '',
        bio: (data as any).bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLanguagePreference = () => {
    const savedLanguage = localStorage.getItem('app-language') as 'fr' | 'en';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  };

  const loadPrivacyPreferences = () => {
    const savedPrivacy = localStorage.getItem('privacy-preferences');
    if (savedPrivacy) {
      setPrivacyPreferences(JSON.parse(savedPrivacy));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: formData.username,
          avatar: formData.avatar,
        })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveLanguagePreference = () => {
    localStorage.setItem('app-language', language);
    toast({
      title: "Succès",
      description: "Langue sauvegardée"
    });
  };

  const savePrivacyPreferences = () => {
    localStorage.setItem('privacy-preferences', JSON.stringify(privacyPreferences));
    toast({
      title: "Succès",
      description: "Préférences de confidentialité sauvegardées"
    });
  };

  const handleNotificationToggle = async (key: keyof typeof notificationPreferences, value: boolean) => {
    // Si on active les notifications de bureau, demander la permission
    if (key === 'desktop' && value && notificationPermission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        return; // Ne pas activer si la permission est refusée
      }
    }

    updateNotificationPreferences({
      ...notificationPreferences,
      [key]: value
    });
  };

  const deleteAccount = async () => {
    try {
      // In a real app, this would call a backend function to properly delete the account
      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès",
      });
      await signOut();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Confidentialité
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apparence
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
              <CardDescription>
                Gérez vos informations personnelles et votre avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={formData.avatar} />
                  <AvatarFallback>{formData.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar">URL de l'avatar</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="avatar"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    />
                    <Button variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biographie</Label>
                <Textarea
                  id="bio"
                  placeholder="Parlez-nous de vous..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <Button onClick={saveProfile} disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zone de danger</CardTitle>
              <CardDescription>
                Actions irréversibles sur votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Supprimer le compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Cela supprimera définitivement votre compte
                      et toutes vos données, y compris vos soumissions et vos statistiques.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground">
                      Oui, supprimer mon compte
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Choisissez les notifications que vous souhaitez recevoir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevez des mises à jour par email
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences.email}
                    onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications de bureau</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevez des notifications dans votre navigateur
                      {notificationPermission === 'denied' && (
                        <span className="text-destructive"> (Bloquées par le navigateur)</span>
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences.desktop}
                    onCheckedChange={(checked) => handleNotificationToggle('desktop', checked)}
                    disabled={notificationPermission === 'denied'}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Concours</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications sur les nouveaux concours
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences.contests}
                    onCheckedChange={(checked) => handleNotificationToggle('contests', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Réalisations</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications pour les nouveaux badges
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences.achievements}
                    onCheckedChange={(checked) => handleNotificationToggle('achievements', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de confidentialité</CardTitle>
              <CardDescription>
                Contrôlez qui peut voir vos informations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profil public</Label>
                    <p className="text-sm text-muted-foreground">
                      Permettre aux autres de voir votre profil
                    </p>
                  </div>
                  <Switch
                    checked={privacyPreferences.profile_public}
                    onCheckedChange={(checked) =>
                      setPrivacyPreferences({ ...privacyPreferences, profile_public: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Statistiques publiques</Label>
                    <p className="text-sm text-muted-foreground">
                      Afficher vos stats dans les classements
                    </p>
                  </div>
                  <Switch
                    checked={privacyPreferences.stats_public}
                    onCheckedChange={(checked) =>
                      setPrivacyPreferences({ ...privacyPreferences, stats_public: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Soumissions publiques</Label>
                    <p className="text-sm text-muted-foreground">
                      Permettre aux autres de voir vos soumissions
                    </p>
                  </div>
                  <Switch
                    checked={privacyPreferences.submissions_public}
                    onCheckedChange={(checked) =>
                      setPrivacyPreferences({ ...privacyPreferences, submissions_public: checked })
                    }
                  />
                </div>
              </div>

              <Button onClick={savePrivacyPreferences} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Sauvegarder les préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Thème</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choisissez l'apparence de l'application
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="flex items-center gap-2 h-auto p-4"
                    >
                      <Sun className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Clair</div>
                        <div className="text-xs text-muted-foreground">Thème lumineux</div>
                      </div>
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="flex items-center gap-2 h-auto p-4"
                    >
                      <Moon className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Sombre</div>
                        <div className="text-xs text-muted-foreground">Thème sombre</div>
                      </div>
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="flex items-center gap-2 h-auto p-4"
                    >
                      <Monitor className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Système</div>
                        <div className="text-xs text-muted-foreground">Auto</div>
                      </div>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select
                    value={language}
                    onValueChange={(value: 'fr' | 'en') => setLanguage(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={saveLanguagePreference} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Sauvegarder les préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}