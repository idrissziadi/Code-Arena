import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, Trophy, Users, Zap } from 'lucide-react';

// Composant pour les objets animés en arrière-plan
const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Particules flottantes */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-warning/50 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '2.5s' }}></div>
      <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-destructive/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
      <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '2s' }}></div>
      
      {/* Formes géométriques flottantes */}
      <div className="absolute top-1/6 right-1/6 w-16 h-16 border-2 border-primary/20 rounded-lg animate-spin" style={{ animationDuration: '20s' }}></div>
      <div className="absolute bottom-1/6 left-1/6 w-12 h-12 border-2 border-accent/20 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
      <div className="absolute top-1/2 left-1/6 w-8 h-8 border-2 border-warning/20 transform rotate-45 animate-spin" style={{ animationDuration: '25s' }}></div>
      <div className="absolute bottom-1/4 right-1/6 w-10 h-10 border-2 border-destructive/20 rounded-lg animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }}></div>
      
      {/* Lignes animées */}
      <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-0 right-1/3 w-px h-24 bg-gradient-to-t from-transparent via-accent/30 to-transparent animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-0 w-20 h-px bg-gradient-to-r from-transparent via-warning/30 to-transparent animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      <div className="absolute top-1/3 right-0 w-16 h-px bg-gradient-to-l from-transparent via-destructive/30 to-transparent animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}></div>
      
      {/* Cercles concentriques */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-primary/10 rounded-full animate-ping" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-accent/10 rounded-full animate-ping" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
      
      {/* Grille de points */}
      <div className="absolute top-1/6 left-1/6 grid grid-cols-3 gap-2 opacity-20">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
        ))}
      </div>
      
      {/* Ondes */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-64 h-64 border border-primary/5 rounded-full animate-ping" style={{ animationDuration: '10s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-accent/5 rounded-full animate-ping" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-warning/5 rounded-full animate-ping" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>
    </div>
  );
};

export const AuthPage: React.FC = () => {
  const { user, userProfile, signIn, signUp, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/dashboard';

  // If already logged in, redirect to intended destination or appropriate default
  if (user && userProfile) {
    // Redirect to admin page if user is admin and was trying to access admin
    if (from === '/admin' && isAdmin()) {
      return <Navigate to="/admin" replace />;
    }
    // Redirect to intended destination or dashboard
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;
    
    await signUp(email, password, username);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Objets animés en arrière-plan */}
      <AnimatedBackground />
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Hero Section */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              CodeArena
            </h1>
            <p className="text-xl text-muted-foreground">
              La plateforme ultime pour maîtriser les algorithmes et structures de données
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Code2 className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">Problèmes</div>
                <div className="text-sm text-muted-foreground">500+ défis</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Trophy className="h-8 w-8 text-accent" />
              <div>
                <div className="font-semibold">Concours</div>
                <div className="text-sm text-muted-foreground">Compétitions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Users className="h-8 w-8 text-warning" />
              <div>
                <div className="font-semibold">Communauté</div>
                <div className="text-sm text-muted-foreground">Entraide</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
              <Zap className="h-8 w-8 text-destructive" />
              <div>
                <div className="font-semibold">Temps réel</div>
                <div className="text-sm text-muted-foreground">Feedback</div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="bg-card/80 backdrop-blur-sm shadow-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Rejoignez CodeArena</CardTitle>
            <CardDescription>
              Commencez votre parcours de développement dès aujourd'hui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="bg-background"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:shadow-primary transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Nom d'utilisateur</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      placeholder="votrenom"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="bg-background"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-accent hover:shadow-accent transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Inscription...' : 'S\'inscrire'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};