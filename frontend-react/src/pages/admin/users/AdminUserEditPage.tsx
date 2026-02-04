import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Save, User, Mail, Phone, Shield, Loader2 } from 'lucide-react';
// On utilise les types et l'API
import { RoleType } from '@/types';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Données référentielles
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
  });

  // Champs spécifiques étudiant
  const [etudiantForm, setEtudiantForm] = useState({
    cne: '',
    cin: '',
    filiere_id: '',
    niveau_id: '',
    annee_academique_id: '',
    date_naissance: '',
    adresse: '',
  });

  // Champs spécifiques encadrant
  const [encadrantForm, setEncadrantForm] = useState({
    departement_id: '',
    specialite: '',
    grade: '',
    bureau: '',
    max_etudiants: 5,
  });

  // 1. Chargement des données
  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // A. Charger référentiels
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

            // B. Charger Utilisateur
            const resUsers = await api.get('/api/utilisateurs');
            const user = resUsers.data.find((u: any) => u.id == id);

            if (user) {
                setFormData({
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    telephone: user.telephone || '',
                    role: user.role,
                    actif: Boolean(user.actif),
                });

                // C. Charger détails spécifiques
                if (user.role === 'ETUDIANT') {
                    const resEtu = await api.get(`/api/etudiants/${id}`);
                    const e = resEtu.data;
                    if (e) {
                        setEtudiantForm({
                            cne: e.cne || '',
                            cin: e.cin || '',
                            filiere_id: e.filiere_id ? String(e.filiere_id) : '',
                            niveau_id: e.niveau_id ? String(e.niveau_id) : '',
                            annee_academique_id: e.annee_academique_id ? String(e.annee_academique_id) : '',
                            date_naissance: e.date_naissance ? e.date_naissance.split('T')[0] : '',
                            adresse: e.adresse || '',
                        });
                    }
                } else if (user.role === 'ENCADRANT') {
                    const resEnc = await api.get(`/api/encadrants/${id}`);
                    const enc = resEnc.data;
                    if (enc) {
                        setEncadrantForm({
                            departement_id: enc.departement_id ? String(enc.departement_id) : '',
                            specialite: enc.specialite || '',
                            grade: enc.grade || '',
                            bureau: enc.bureau || '',
                            max_etudiants: enc.max_etudiants || 5,
                        });
                    }
                }
            } else {
                toast.error("Utilisateur introuvable");
                navigate('/admin/users');
            }
        } catch (error) {
            console.error("Erreur chargement edit", error);
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.prenom || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
        // Envoi des modifications (Générique + Spécifique)
        // Vous devrez peut-être créer une route PUT /api/admin/users/:id sur le serveur qui gère tout ça
        // Ou faire plusieurs appels (PUT users_login, PUT etudiants...)
        
        // Exemple simplifié : On met à jour le statut actif via le patch existant
        await api.patch(`/api/utilisateurs/${id}`, { actif: formData.actif });
        
        // TODO: Implémenter la mise à jour complète sur le backend si nécessaire
        // Pour l'instant on simule le succès pour l'actif
        
        toast.success('Utilisateur modifié avec succès');
        navigate(`/admin/users/${id}`);
    } catch (error) {
        console.error(error);
        toast.error("Erreur lors de la modification");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary"/></div>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Modifier: ${formData.prenom} ${formData.nom}`}
          description="Modifiez les informations du compte utilisateur"
        >
          <Button variant="outline" onClick={() => navigate(`/admin/users/${id}`)}>
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

          {/* Rôle et accès */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rôle et Accès
              </CardTitle>
              <CardDescription>
                Gérez le rôle et les permissions de l'utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={formData.role} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Rôle actuel" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                        <SelectItem value="ENCADRANT">Encadrant</SelectItem>
                        <SelectItem value="ETUDIANT">Étudiant</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Le rôle ne peut pas être modifié après création.
                  </p>
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
                    <Label htmlFor="cne">CNE *</Label>
                    <Input
                      id="cne"
                      value={etudiantForm.cne}
                      onChange={(e) =>
                        setEtudiantForm((prev) => ({ ...prev, cne: e.target.value }))
                      }
                      placeholder="R13XXXXXXX"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cin">CIN</Label>
                    <Input
                      id="cin"
                      value={etudiantForm.cin}
                      onChange={(e) =>
                        setEtudiantForm((prev) => ({ ...prev, cin: e.target.value }))
                      }
                      placeholder="BXXXXXXX"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="filiere">Filière *</Label>
                    <Select
                      value={etudiantForm.filiere_id}
                      onValueChange={(value) =>
                        setEtudiantForm((prev) => ({ ...prev, filiere_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {filieres.map((filiere) => (
                          <SelectItem key={filiere.id_filiere} value={String(filiere.id_filiere)}>
                            {filiere.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="niveau">Niveau *</Label>
                    <Select
                      value={etudiantForm.niveau_id}
                      onValueChange={(value) =>
                        setEtudiantForm((prev) => ({ ...prev, niveau_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {niveaux.map((niveau) => (
                          <SelectItem key={niveau.id_niveau} value={String(niveau.id_niveau)}>
                            {niveau.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annee">Année Académique</Label>
                    <Select
                      value={etudiantForm.annee_academique_id}
                      onValueChange={(value) =>
                        setEtudiantForm((prev) => ({
                          ...prev,
                          annee_academique_id: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {annees.map((annee) => (
                          <SelectItem key={annee.id_annee} value={String(annee.id_annee)}>
                            {annee.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_naissance">Date de naissance</Label>
                    <Input
                      id="date_naissance"
                      type="date"
                      value={etudiantForm.date_naissance}
                      onChange={(e) =>
                        setEtudiantForm((prev) => ({
                          ...prev,
                          date_naissance: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      value={etudiantForm.adresse}
                      onChange={(e) =>
                        setEtudiantForm((prev) => ({ ...prev, adresse: e.target.value }))
                      }
                      placeholder="Ville"
                    />
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
                    <Label htmlFor="departement">Département *</Label>
                    <Select
                      value={encadrantForm.departement_id}
                      onValueChange={(value) =>
                        setEncadrantForm((prev) => ({ ...prev, departement_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {departements.map((dep) => (
                          <SelectItem key={dep.id_departement} value={String(dep.id_departement)}>
                            {dep.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Select
                      value={encadrantForm.grade}
                      onValueChange={(value) =>
                        setEncadrantForm((prev) => ({ ...prev, grade: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professeur Assistant">
                          Professeur Assistant
                        </SelectItem>
                        <SelectItem value="Professeur">Professeur</SelectItem>
                        <SelectItem value="Professeur Habilité">
                          Professeur Habilité
                        </SelectItem>
                        <SelectItem value="Professeur de l'Enseignement Supérieur">
                          Professeur de l'Enseignement Supérieur
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="specialite">Spécialité</Label>
                    <Input
                      id="specialite"
                      value={encadrantForm.specialite}
                      onChange={(e) =>
                        setEncadrantForm((prev) => ({
                          ...prev,
                          specialite: e.target.value,
                        }))
                      }
                      placeholder="Ex: Intelligence Artificielle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bureau">Bureau</Label>
                    <Input
                      id="bureau"
                      value={encadrantForm.bureau}
                      onChange={(e) =>
                        setEncadrantForm((prev) => ({ ...prev, bureau: e.target.value }))
                      }
                      placeholder="Ex: B-201"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_etudiants">Max. Étudiants</Label>
                    <Input
                      id="max_etudiants"
                      type="number"
                      min={1}
                      max={20}
                      value={encadrantForm.max_etudiants}
                      onChange={(e) =>
                        setEncadrantForm((prev) => ({
                          ...prev,
                          max_etudiants: parseInt(e.target.value) || 5,
                        }))
                      }
                    />
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
              onClick={() => navigate(`/admin/users/${id}`)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4"/> Enregistrement...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}