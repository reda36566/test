import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    setIsLoading(true);

    try {
        // ✅ APPEL API RÉEL
        await api.post('/api/change-password', {
            id_user: user?.id_user,
            current: currentPassword,
            next: newPassword
        });

        toast.success('Mot de passe modifié avec succès !');
        // On retourne à la page précédente (Paramètres)
        navigate(-1);

    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.error || "Erreur lors du changement de mot de passe";
        toast.error(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const content = (
    <div className="max-w-md mx-auto mt-8">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Changer le mot de passe</CardTitle>
          <CardDescription>
            Renseignez votre mot de passe actuel et choisissez un nouveau mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Ancien mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="current">Mot de passe actuel</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="current"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10"
                  required
                  placeholder="••••"
                />
              </div>
            </div>

            <hr className="my-4" />

            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="new">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  required
                  placeholder="••••"
                  minLength={4}
                />
              </div>
            </div>

            {/* Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  placeholder="••••"
                />
              </div>
            </div>

            {/* Bouton Afficher/Masquer */}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showPasswords ? 'Masquer' : 'Afficher'} les mots de passe
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Modification...
                    </>
                ) : (
                    <>
                        <CheckCircle className="mr-2 h-4 w-4" /> Enregistrer
                    </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  if (user) {
    return (
        <AppLayout>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            {content}
        </AppLayout>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        {content}
      </div>
    </div>
  );
}