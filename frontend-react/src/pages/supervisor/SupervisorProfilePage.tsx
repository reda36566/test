import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPlatformSettings, maskEmailValue } from '@/contexts/AdminPlatformSettingsContext';
import { useAvatar } from '@/contexts/AvatarContext';
import { toast } from 'sonner';
import { BookOpen, Lock, User, Loader2, Save, Camera } from 'lucide-react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getGravatarUrl } from '@/lib/gravatar';
import { useRef } from 'react';

export default function SupervisorProfilePage() {
  const { user } = useAuth();
  const { settings } = useAdminPlatformSettings();
  const { avatarUrl, avatarType, setUploadedAvatar, setEmailAvatar, clearAvatar, emailAvatarFailed, handleAvatarError } = useAvatar();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour le changement de mot de passe
  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [loadingPwd, setLoadingPwd] = useState(false);

  // États pour les préférences (Simulées car pas en BDD pour l'instant)
  const [preferences, setPreferences] = useState({
    notifications: true,
    weeklyDigest: false,
  });

  // 1. CHARGEMENT DU PROFIL
  useEffect(() => {
    const fetchProfile = async () => {
      // On récupère l'ID spécifique (id_encadrant) depuis le token utilisateur
      const encadrantId = (user as any)?.id_specifique;
      
      if (encadrantId) {
        try {
          // ✅ CORRECTION : Ajout de /api
          const res = await api.get(`/api/encadrants/${encadrantId}`);
          setProfile(res.data);
        } catch (error) {
          console.error("Erreur chargement profil", error);
          toast.error("Impossible de charger le profil");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const rawEmail = profile?.email || `${(user as any)?.login}@ensa.ma`;
  const displayEmail = settings.security.maskEmail ? maskEmailValue(rawEmail) : rawEmail;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format invalide. Utilisez JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La photo dépasse 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedAvatar(reader.result);
        setAvatarMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEmailAvatar = async () => {
    const email = rawEmail;
    if (!email) {
      toast.error('Email indisponible pour charger la photo.');
      return;
    }
    const url = getGravatarUrl(email);
    if (!url) {
      toast.error('Email indisponible pour charger la photo.');
      return;
    }
    const tester = new Image();
    const checkUrl = `${url}&d=404`;
    tester.onload = () => {
      setEmailAvatar(email);
      setAvatarMessage(null);
    };
    tester.onerror = () => {
      clearAvatar();
      setAvatarMessage("Aucune photo associée à cet email. Une icône sera utilisée.");
    };
    tester.src = checkUrl;
  };

  // 2. GESTION MOT DE PASSE
  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      toast.error('Veuillez compléter tous les champs');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setLoadingPwd(true);
    try {
      // ✅ CORRECTION : Ajout de /api
      await api.post('/api/change-password', {
        id_user: (user as any)?.id_user,
        current: passwords.current,
        next: passwords.next
      });
      
      toast.success('Mot de passe mis à jour avec succès !');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (error: any) {
      console.error(error);
      // On affiche l'erreur renvoyée par le serveur (ex: "Mot de passe actuel incorrect")
      toast.error(error.response?.data?.error || "Erreur lors du changement");
    } finally {
      setLoadingPwd(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary"/></div>;

  return (
    <AppLayout>
      <PageHeader title="Mon Profil" description="Gérez vos informations personnelles et votre sécurité" />

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* COLONNE GAUCHE : INFOS PERSONNELLES */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations Encadrant
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <Input value={profile?.nom || ''} readOnly className="bg-slate-50" />
            </div>
            <div>
              <Label>Prénom</Label>
              <Input value={profile?.prenom || ''} readOnly className="bg-slate-50" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={displayEmail || 'Non renseigné'} readOnly className="bg-slate-50" />
            </div>
            <div>
              <Label>Spécialité</Label>
              <Input value={profile?.specialite || 'Généraliste'} readOnly className="bg-slate-50" />
            </div>
            <div className="md:col-span-2">
              <Label>Rôle système</Label>
              <Input value="ENCADRANT (Professeur)" readOnly className="bg-slate-50 font-mono text-xs" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-start-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photo de profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt="Photo de profil" onError={handleAvatarError} />
                )}
                <AvatarFallback className="text-lg font-semibold">
                  {profile?.prenom?.[0] || profile?.nom?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleUploadClick}>
                    Importer une photo
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEmailAvatar}>
                    Utiliser la photo email
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAvatar}>
                    Supprimer
                  </Button>
                </div>
                {avatarMessage && (
                  <p className="text-xs text-muted-foreground">{avatarMessage}</p>
                )}
                {emailAvatarFailed && avatarType === 'email' && (
                  <p className="text-xs text-muted-foreground">
                    Aucune photo associée à cet email. Une icône sera utilisée.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        
      </div>

      
    </AppLayout>
  );
}
