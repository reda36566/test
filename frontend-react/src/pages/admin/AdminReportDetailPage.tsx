import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Archive,
  Download,
  Eye,
  FileText,
  History,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '@/lib/api';

// Mapping pour l'affichage des badges
const getStatusBadge = (status: string) => {
  const s = (status || '').trim();
  
  // ✅ DÉCLARATION OBLIGATOIRE (pour éviter la page blanche)
  let colorClass = "bg-gray-100 text-gray-800"; 

  if (s === 'Validé') colorClass = "bg-green-100 text-green-800";
  else if (s === 'Soumis') colorClass = "bg-blue-100 text-blue-800";
  else if (s === 'À corriger') colorClass = "bg-yellow-100 text-yellow-800";

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${colorClass}`}>
      {s || 'Inconnu'}
    </span>
  );
};

export default function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [rapport, setRapport] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [plagiat, setPlagiat] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [forceStatusOpen, setForceStatusOpen] = useState(false);
  const [forcedStatusId, setForcedStatusId] = useState<string>('2'); // Par défaut 2=Validé
  const [justification, setJustification] = useState('');

  // 1. CHARGEMENT DES DONNÉES
  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // A. On récupère la liste complète pour avoir les JOIN (noms étudiants/profs/statuts)
            // C'est plus simple que de refaire une requête SQL complexe pour un seul ID dans le backend actuel
            const resReports = await api.get('/api/admin/reports');
            const foundRapport = resReports.data.find((r: any) => r.id_rapport == id);
            
            if (foundRapport) {
                setRapport(foundRapport);
                
                // B. Récupérer les versions
                const resVersions = await api.get(`/api/rapports/${id}/versions`);
                setVersions(resVersions.data);

                // C. Récupérer le plagiat (si existe)
                try {
                    const resPlagiat = await api.get('/api/admin/plagiat');
                    const foundPlagiat = resPlagiat.data.find((p: any) => p.id_rapport == id);
                    setPlagiat(foundPlagiat);
                } catch(e) { console.log("Pas d'info plagiat"); }
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement du rapport");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  // 2. ACTION : Forcer le statut
  const handleForceStatus = async () => {
    if (!justification) {
      toast.error('Veuillez ajouter une justification');
      return;
    }
    
    try {
        await api.post('/api/encadrant/valider', {
            id_rapport: id,
            id_statut: parseInt(forcedStatusId),
            // On peut ajouter un champ 'commentaire_admin' si la base le permettait
        });
        
        toast.success('Statut mis à jour avec succès');
        setForceStatusOpen(false);
        setJustification('');
        // Recharger la page pour voir le changement
        window.location.reload();
    } catch (error) {
        toast.error("Erreur lors de la mise à jour");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!rapport) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Rapport introuvable</h2>
          <Button className="mt-4" onClick={() => navigate('/admin/reports')}>Retour</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Détail du rapport"
          description={`ID: ${rapport.id_rapport} - ${rapport.titre}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/reports')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              
              <Dialog open={forceStatusOpen} onOpenChange={setForceStatusOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Forcer un statut
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Forcer le statut</DialogTitle>
                    <DialogDescription>Cette action changera immédiatement l'état du rapport.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nouveau Statut</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={forcedStatusId}
                        onChange={(e) => setForcedStatusId(e.target.value)}
                      >
                        <option value="1">Soumis</option>
                        <option value="2">Validé</option>
                        <option value="3">En attente / Corrections</option>
                        <option value="4">Refusé</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Justification (Interne)</label>
                      <Textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Motif de l'intervention administrative..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setForceStatusOpen(false)}>Annuler</Button>
                    <Button onClick={handleForceStatus}>Appliquer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">{rapport.type}</Badge>
          {getStatusBadge(rapport.statut)}
          <Badge variant="secondary" className="bg-gray-100">
             Dernière maj : {format(new Date(rapport.date_depot), 'dd/MM/yyyy')}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="overview">Vue générale</TabsTrigger>
            <TabsTrigger value="versions">Versions ({versions.length})</TabsTrigger>
            <TabsTrigger value="plagiarism">Plagiat</TabsTrigger>
            <TabsTrigger value="grade">Note</TabsTrigger>
          </TabsList>

          {/* VUE GÉNÉRALE */}
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Titre du sujet</p>
                    <p className="font-medium text-lg">{rapport.titre}</p>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{rapport.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date de dépôt initial</p>
                      <p className="font-medium">{format(new Date(rapport.date_depot), 'dd MMM yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Acteurs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Étudiant</p>
                    <p className="font-medium text-blue-600">{rapport.prenom_etudiant} {rapport.nom_etudiant}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Encadrant</p>
                    <p className="font-medium">{rapport.nom_encadrant ? `Pr. ${rapport.nom_encadrant}` : 'Non assigné'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* VERSIONS */}
          <TabsContent value="versions">
            <Card>
              <CardHeader><CardTitle>Historique des dépôts</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Fichier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center">Aucune version trouvée</TableCell></TableRow>
                    ) : (
                        versions.map((v: any) => (
                        <TableRow key={v.id_version}>
                            <TableCell><Badge variant="outline">V{v.numero_version}</Badge></TableCell>
                            <TableCell className="font-mono text-xs">{v.fichier_path}</TableCell>
                            <TableCell>{format(new Date(v.date_depot), 'dd MMM yyyy HH:mm')}</TableCell>
                            <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => window.open(`http://localhost:3000/uploads/${v.fichier_path}`, '_blank')}>
                                <Download className="h-4 w-4 mr-2" /> Télécharger
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLAGIAT */}
          <TabsContent value="plagiarism">
            <Card>
              <CardHeader><CardTitle>Analyse Anti-Plagiat</CardTitle></CardHeader>
              <CardContent>
                {plagiat ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl font-bold ${plagiat.score_similitude > 20 ? 'text-red-600' : 'text-green-600'}`}>
                        {plagiat.score_similitude}%
                      </div>
                      <Badge variant={plagiat.score_similitude > 20 ? 'destructive' : 'default'}>
                        {plagiat.statut}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Analysé le : {format(new Date(plagiat.date_analyse), 'dd/MM/yyyy')}</p>
                    <div className="p-4 bg-muted rounded-md text-sm">
                        {plagiat.details}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    Aucune analyse de plagiat n'a été effectuée pour ce rapport.
                    <br/>
                    <Button variant="link" className="mt-2" onClick={() => navigate('/admin/plagiat')}>Aller au module Plagiat</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTE */}
          <TabsContent value="grade">
            <Card>
              <CardHeader><CardTitle>Évaluation</CardTitle></CardHeader>
              <CardContent>
                {rapport.note ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="text-5xl font-bold text-primary mb-2">{rapport.note}/20</div>
                    <p className="text-muted-foreground text-center italic">
                        "{rapport.commentaire_encadrant || "Pas de commentaire"}"
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Ce rapport n'a pas encore été noté par l'encadrant.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
}