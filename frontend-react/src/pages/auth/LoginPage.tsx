import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

const loginSchema = z.object({
  login: z.string().min(1, 'L\'identifiant est requis'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Appel API
      // On ajoute /api ici manuellement
    const response = await api.post('/api/login', data);

      if (response.data.success) {
        const userData = response.data.user;
        
        // --- AMÉLIORATION ICI ---
        // On s'assure que le rôle est bien en majuscules pour la comparaison
        const role = String(userData.role).toUpperCase(); 
        
        // On stocke l'utilisateur dans le contexte
        login(userData);

        // Gestion de la redirection
        const from = (location.state as any)?.from?.pathname;
        
        if (from) {
            navigate(from, { replace: true });
        } else {
            // Redirection selon le rôle normalisé
            if (role === 'ADMIN') {
                navigate('/admin/dashboard', { replace: true });
            } else if (role === 'ENCADRANT') {
                navigate('/supervisor/dashboard', { replace: true });
            } else {
                // Par défaut, on envoie vers étudiant (plus sûr)
                navigate('/student/dashboard', { replace: true });
            }
        }
        
      } else {
        setError("Identifiants incorrects");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      // On gère le cas où le serveur est éteint
      const msg = err.response?.data?.error || "Impossible de se connecter au serveur.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          
          <CardTitle className="text-2xl font-bold">E-RAPPORTS</CardTitle>
          <CardDescription>
            Système de gestion des rapports académiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Connexion</h2>
            <p className="text-sm text-muted-foreground">
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Identifiant (Login)</Label>
              <Input
                id="login"
                placeholder="ex: ghali ou prof"
                {...register('login')}
                disabled={isLoading}
              />
              {errors.login && (
                <p className="text-sm text-destructive">{errors.login.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="........"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>Se connecter</>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link 
            to="/forgot-password" 
            className="text-sm text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </CardFooter>
      </Card>
      
      <div className="fixed bottom-4 text-center text-xs text-muted-foreground">
        © 2026 ENSA Reports - Tous droits réservés
      </div>
    </div>
  );
}