import { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Pencil,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building2,
  GraduationCap,
  FileText,
  Clock,
  Loader2
} from 'lucide-react';
// On utilise les vrais types et l'API
import { Utilisateur, RoleType } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
// Assurez-vous que ces composants existent ou retirez-les
const StatusBadge = ({ status }: any) => <Badge>{status || 'N/A'}</Badge>; 
const TypeBadge = ({ type }: any) => <Badge variant="outline">{type || 'N/A'}</Badge>;

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // États pour stocker les données
  const [user, setUser] = useState<any>(null); // Info de base (users_login)
  const [details, setDetails] = useState<any>(null); // Info etudiant/encadrant
  const [rapports, setRapports] = useState<any[]>([]); // Liste des rapports
  const [historique, setHistorique] = useState<any[]>([]); // Logs d'action
  const [loading, setLoading] = useState(true);

  // 1. CHARGEMENT DES DONNÉES
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // A. Récupérer l'utilisateur de base (users_login)
        // Note: On pourrait créer une route /api/users/:id, mais ici on va filtrer la liste globale si l'endpoint spécifique n'existe pas encore
        const resUsers = await api.get('/api/utilisateurs'); 
        const foundUser = resUsers.data.find((u: any) => u.id == id);
        
        if (foundUser) {
            setUser(foundUser);
            
            // B. Récupérer les détails selon le rôle
            if (foundUser.role === 'ETUDIANT') {
                const resEtu = await api.get(`/api/etudiants/${foundUser.id}`); // ID user = ID etudiant souvent, sinon adapter
                setDetails(resEtu.data);
                
                // C. Rapports de l'étudiant
                const resRapports = await api.get(`/api/etudiant/rapports?id_etudiant=${foundUser.id}`);
                setRapports(resRapports.data || []);
            } 
            else if (foundUser.role === 'ENCADRANT') {
                const resEnc = await api.get(`/api/encadrants/${foundUser.id}`);
                setDetails(resEnc.data);
                
                // C. Rapports supervisés
                const resRapports = await api.get(`/api/encadrant/rapports?id_encadrant=${foundUser.id}`);
                setRapports(resRapports.data || []);
            }

            // D. Historique (Tous les rôles)
            const resHist = await api.get(`/api/historique?id_user=${foundUser.id}`);
            setHistorique(resHist.data || []);
        }
      } catch (error) {
        console.error("Erreur chargement profil", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary"/></div>;

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold">Utilisateur non trouvé</h2>
          <p className="text-muted-foreground mt-2">
            L'utilisateur demandé n'existe pas ou a été supprimé.
          </p>
          <Button className="mt-4" onClick={() => navigate('/admin/users')}>
            Retour à la liste
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title={`${user.prenom || 'Utilisateur'} ${user.nom || ''}`}
          description={`Détails du compte utilisateur - ${user.role}`}
        >
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <Button onClick={() => navigate(`/admin/users/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </PageHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Carte profil */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold uppercase">
                  {user.login?.[0] || 'U'}
                </div>
                <div>
                  <CardTitle>{user.prenom} {user.nom}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <Badge variant={user.actif ? 'default' : 'secondary'} className={user.actif ? "bg-green-600" : ""}>
                  {user.actif ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rôle</span>
                <Badge variant="outline">{user.role}</Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email || 'Non renseigné'}</span>
                </div>
                {/* On affiche login si pas d'autre info */}
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Login: {user.login}</span>
                </div>
                {user.derniere_connexion && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Dernière connexion:{' '}
                      {format(new Date(user.derniere_connexion), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contenu principal */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="rapports">
                  Rapports ({rapports.length})
                </TabsTrigger>
                <TabsTrigger value="historique">Historique</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {/* Infos Étudiant */}
                {user.role === 'ETUDIANT' && details && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Informations Étudiant
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">CNE</p>
                          <p className="font-medium">{details.cne || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CIN</p>
                          <p className="font-medium">{details.cin || '—'}</p>
                        </div>
                        {/* Ajoutez d'autres champs si votre API /etudiants/:id les renvoie (filiere, niveau...) */}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Infos Encadrant */}
                {user.role === 'ENCADRANT' && details && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Informations Encadrant
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Spécialité</p>
                          <p className="font-medium">{details.specialite || '—'}</p>
                        </div>
                        {/* Ajoutez d'autres champs si dispo */}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Infos Admin */}
                {user.role === 'ADMIN' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Droits Administrateur
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Cet utilisateur dispose de tous les droits d'administration sur la plateforme.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="rapports">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Rapports Associés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rapports.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun rapport associé à cet utilisateur.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rapports.map((rapport: any) => (
                            <TableRow key={rapport.id_rapport}>
                              <TableCell className="font-medium">
                                {/* Lien vers le détail rapport admin (si route existe) */}
                                {rapport.titre}
                              </TableCell>
                              <TableCell>
                                <TypeBadge type={rapport.type_rapport || rapport.type_libelle} />
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={rapport.statut_label || rapport.statut_libelle} />
                              </TableCell>
                              <TableCell>
                                {rapport.date_depot ? format(new Date(rapport.date_depot), 'dd MMM yyyy', { locale: fr }) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historique">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Historique des Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historique.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune action enregistrée pour cet utilisateur.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {historique.map((action: any) => (
                          <div
                            key={action.id_action}
                            className="flex items-start gap-4 border-b pb-4 last:border-0"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{action.type_action}</p>
                              {action.details && (
                                <p className="text-sm text-muted-foreground">
                                  {action.details}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(action.date_action), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}