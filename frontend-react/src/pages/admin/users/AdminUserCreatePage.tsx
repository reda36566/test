import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
// ✅ CORRECTION ICI : Ajout de Loader2 dans les imports
import { ArrowLeft, Save, User, Mail, Phone, Shield, Lock, Loader2 } from 'lucide-react';
import { RoleType } from '@/types';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminUserCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour les listes déroulantes chargées depuis l'API
  const [departements, setDepartements] = useState<any[]>([]);
  const [filieres, setFilieres] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<any[]>([]);
  const [annees, setAnnees] = useState<any[]>([]);

  // Champs utilisateur de base
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: '' as RoleType | '',
    actif: true,
    login: '',      // Ajouté pour la création
    password: '',   // Ajouté pour la création
  });

  // Champs spécifiques étudiant
  const [etudiantData, setEtudiantData] = useState({
    cne: '',
    cin: '',
    filiere_id: '',
    niveau_id: '',
    annee_academique_id: '',
    date_naissance: '',
    adresse: '',
  });

  // Champs spécifiques encadrant
  const [encadrantData, setEncadrantData] = useState({
    departement_id: '',
    specialite: '',
    grade: '',
    bureau: '',
    max_etudiants: 5,
  });

  // 1. Chargement des données référentielles au montage
  useEffect(() => {
    const fetchRefData = async () => {
        try {
            const [resDep, resFil, resNiv, resAnn] = await Promise.all([
                api.get('/api/admin/academic/departements').catch(() => ({ data: [] })),
                api.get('/api/admin/academic/filieres').catch(() => ({ data: [] })),
                api.get('/api/admin/academic/niveaux').catch(() => ({ data: [] })),
                api.get('/api/admin/academic/annees').catch(() => ({ data: [] })),
            ]);
            setDepartements(resDep.data || []);
            setFilieres(resFil.data || []);
            setNiveaux(resNiv.data || []);
            setAnnees(resAnn.data || []);
        } catch (error) {
            console.error("Erreur chargement référentiel", error);
        }
    };
    fetchRefData();
  }, []);

  // Génération automatique du login
  useEffect(() => {
    if (formData.prenom && formData.nom && !formData.login) {
        const loginGen = `${formData.prenom.charAt(0).toLowerCase()}${formData.nom.toLowerCase()}`.replace(/\s/g, '');
        setFormData(prev => ({ ...prev, login: loginGen }));
    }
  }, [formData.prenom, formData.nom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.prenom || !formData.email || !formData.role || !formData.login || !formData.password) {
      toast.error('Veuillez remplir tous les champs obligatoires (y compris login/password)');
      return;
    }

    if (formData.role === 'ETUDIANT' && (!etudiantData.filiere_id || !etudiantData.niveau_id)) {
      toast.error('Veuillez sélectionner la filière et le niveau pour l\'étudiant');
      return;
    }

    setIsSubmitting(true);
    
    try {
        // Construction de l'objet à envoyer
        const payload = {
            ...formData,
            ...etudiantData,
            ...encadrantData
        };

        await api.post('/api/admin/users', payload);
        
        toast.success('Utilisateur créé avec succès');
        navigate('/admin/users');
    } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.error || "Erreur lors de la création");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Créer un Utilisateur"
          description="Ajoutez un nouveau compte utilisateur à la plateforme"
        >
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </PageHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>
                Informations de base de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    placeholder="Prénom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@ensa.ma"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => handleInputChange('telephone', e.target.value)}
                      placeholder="06XXXXXXXX"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identifiants de connexion (NOUVEAU BLOC) */}
          <Card className="border-blue-100 bg-blue-50/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Lock className="h-5 w-5" />
                Identifiants de Connexion
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="login">Nom d'utilisateur (Login) *</Label>
                  <Input
                    id="login"
                    value={formData.login}
                    onChange={(e) => handleInputChange('login', e.target.value)}
                    placeholder="jdupont"
                    required
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white"
                  />
                </div>
            </CardContent>
          </Card>

          {/* Rôle et accès */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rôle et Accès
              </CardTitle>
              <CardDescription>
                Définissez le rôle et les permissions de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value as RoleType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                        <SelectItem value="ENCADRANT">Encadrant (Professeur)</SelectItem>
                        <SelectItem value="ETUDIANT">Étudiant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Compte actif</Label>
                    <p className="text-sm text-muted-foreground">
                      L'utilisateur peut se connecter
                    </p>
                  </div>
                  <Switch
                    checked={formData.actif}
                    onCheckedChange={(checked) => handleInputChange('actif', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Champs spécifiques Étudiant */}
          {formData.role === 'ETUDIANT' && (
            <Card>
              <CardHeader>
                <CardTitle>Informations Étudiant</CardTitle>
                <CardDescription>
                  Informations spécifiques au profil étudiant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cne">CNE</Label>
                    <Input
                      id="cne"
                      value={etudiantData.cne}
                      onChange={(e) => setEtudiantData((prev) => ({ ...prev, cne: e.target.value }))}
                      placeholder="R13XXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cin">CIN</Label>
                    <Input
                      id="cin"
                      value={etudiantData.cin}
                      onChange={(e) => setEtudiantData((prev) => ({ ...prev, cin: e.target.value }))}
                      placeholder="BXXXXXXX"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="filiere">Filière *</Label>
                    <Select
                      value={etudiantData.filiere_id?.toString()}
                      onValueChange={(value) => setEtudiantData((prev) => ({ ...prev, filiere_id: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {filieres.map((filiere) => (
                          <SelectItem key={filiere.id_filiere} value={filiere.id_filiere.toString()}>
                            {filiere.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="niveau">Niveau *</Label>
                    <Select
                      value={etudiantData.niveau_id?.toString()}
                      onValueChange={(value) => setEtudiantData((prev) => ({ ...prev, niveau_id: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {niveaux.map((niveau) => (
                          <SelectItem key={niveau.id_niveau} value={niveau.id_niveau.toString()}>
                            {niveau.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annee">Année Académique</Label>
                    <Select
                      value={etudiantData.annee_academique_id?.toString()}
                      onValueChange={(value) => setEtudiantData((prev) => ({ ...prev, annee_academique_id: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
  {annees.map((annee) => {
    // Calcul des années pour l'affichage
    const start = new Date(annee.date_debut).getFullYear();
    const end = new Date(annee.date_fin).getFullYear();
    
    return (
      <SelectItem key={annee.id_annee} value={annee.id_annee.toString()}>
        {start} - {end}
      </SelectItem>
    );
  })}
</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Champs spécifiques Encadrant */}
          {formData.role === 'ENCADRANT' && (
            <Card>
              <CardHeader>
                <CardTitle>Informations Encadrant</CardTitle>
                <CardDescription>
                  Informations spécifiques au profil encadrant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="departement">Département</Label>
                    <Select
                      value={encadrantData.departement_id?.toString()}
                      onValueChange={(value) => setEncadrantData((prev) => ({ ...prev, departement_id: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {departements.map((dep) => (
                          <SelectItem key={dep.id_departement} value={dep.id_departement.toString()}>
                            {dep.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={encadrantData.grade}
                      onValueChange={(value) => setEncadrantData((prev) => ({ ...prev, grade: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professeur Assistant">Professeur Assistant</SelectItem>
                        <SelectItem value="Professeur">Professeur</SelectItem>
                        <SelectItem value="Professeur Habilité">Professeur Habilité</SelectItem>
                        <SelectItem value="Professeur de l'Enseignement Supérieur">PES</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4"/> Création...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer l'utilisateur
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}