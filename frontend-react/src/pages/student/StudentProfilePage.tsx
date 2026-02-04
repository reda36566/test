import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { User, BarChart3, Loader2, Mail, GraduationCap, Camera } from 'lucide-react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAvatar } from '@/contexts/AvatarContext';
import { useAdminPlatformSettings, maskEmailValue } from '@/contexts/AdminPlatformSettingsContext';
import { toast } from 'sonner';
import { getGravatarUrl } from '@/lib/gravatar';
import { useRef } from 'react';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { settings } = useAdminPlatformSettings();
  const { avatarUrl, avatarType, setUploadedAvatar, setEmailAvatar, clearAvatar, emailAvatarFailed, handleAvatarError } = useAvatar();
  const [profile, setProfile] = useState<any>(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      // On récupère l'ID propre
      const studentId = (user as any)?.id_specifique || (user as any)?.id_etudiant;

      if (studentId) {
        try {
          // 1. Récupérer les infos du profil
          // ✅ CORRECTION : Ajout de /api
          const resProfile = await api.get(`/api/etudiants/${studentId}`);
          setProfile(resProfile.data);

          // 2. Récupérer les rapports pour les stats
          // ✅ CORRECTION : Ajout de /api
          const resReports = await api.get(`/api/etudiant/rapports?id_etudiant=${studentId}`);
          setReportsCount(resReports.data.length || 0);

        } catch (error) {
          console.error("Erreur chargement profil", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
      return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  // Si pas de profil trouvé, on affiche les données de base de l'AuthContext
  const displayNom = profile?.nom || (user as any)?.login || '-';
  const displayPrenom = profile?.prenom || '';
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

  return (
    <AppLayout>
      <PageHeader title="Profil étudiant" description="Vos informations personnelles et académiques" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Carte Informations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <div className="flex items-center mt-1">
                 <Input value={displayNom} readOnly className="bg-slate-50" />
              </div>
            </div>
            <div>
              <Label>Prénom</Label>
              <Input value={displayPrenom} readOnly className="bg-slate-50" />
            </div>
            <div className="md:col-span-2">
              <Label>Email Institutionnel</Label>
              <div className="relative mt-1">
                 <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input value={displayEmail} readOnly className="pl-9 bg-slate-50" />
              </div>
            </div>
            
            {/* Ces champs sont statiques car ils ne sont pas encore dans votre BDD */}
            <div>
              <Label>Filière</Label>
              <div className="relative mt-1">
                 <GraduationCap className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input value={profile?.filiere || "Génie Informatique"} readOnly className="pl-9 bg-slate-50" />
              </div>
            </div>
            <div>
              <Label>Niveau</Label>
              <Input value={profile?.niveau || "4ème Année"} readOnly className="bg-slate-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
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
                  {displayPrenom?.[0] || displayNom?.[0] || 'E'}
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

        {/* Carte Statistiques */}
        <Card className="lg:col-start-3 lg:row-start-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Activité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rapports Déposés</p>
                <p className="text-3xl font-bold text-primary">{reportsCount}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary/20" />
            </div>
            
            <div>
                <p className="text-sm font-medium mb-2">Statut du compte</p>
                <Badge className="bg-green-500 hover:bg-green-600">Actif</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
