import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shield, User, Lock, Palette, Loader2 } from 'lucide-react';
import api from '@/lib/api'; 

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [preferences, setPreferences] = useState({
    compactMode: false,
    darkMode: false,
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  if (!user) return null;

  // --- CORRECTION ICI ---
  // On utilise "any" pour contourner l'erreur TypeScript et accéder aux propriétés
  // peu importe la structure exacte renvoyée par le backend (imbriquée ou plate)
  const userData = user as any;
  const userId = userData.id_user || userData.user?.id_user || userData.id;
  
  // Safe access pour l'affichage (évite les bugs si une info manque)
  const nom = userData.nom || userData.utilisateur?.nom || 'Admin';
  const prenom = userData.prenom || userData.utilisateur?.prenom || 'Principal';
  const email = userData.email || userData.utilisateur?.email || 'admin@ensa.ma';
  const role = userData.role || 'ADMINISTRATEUR';

  const handlePasswordChange = async () => {
    // 1. Validation locale
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (passwords.next.length < 4) {
      toast.error('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    setLoading(true);
    try {
      // 2. Appel API réel
      await api.post('/api/change-password', {
        id_user: userId, // On utilise l'ID récupéré plus haut
        current: passwords.current,
        next: passwords.next,
      });

      toast.success('Mot de passe mis à jour avec succès !');
      setPasswords({ current: '', next: '', confirm: '' }); 
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.error || "Erreur lors du changement de mot de passe";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Profil administrateur" description="Informations et préférences" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* CARTE INFOS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <Input value={nom} readOnly className="bg-muted" />
            </div>
            <div>
              <Label>Prénom</Label>
              <Input value={prenom} readOnly className="bg-muted" />
            </div>
            <div className="md:col-span-2">
              <Label>Email</Label>
              <Input value={email} readOnly className="bg-muted" />
            </div>
            <div>
              <Label>Rôle</Label>
              <Input value={role} readOnly className="bg-muted" />
            </div>
            <div>
              <Label>Statut</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-green-50 text-green-700 text-sm font-medium">
                Actif
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}