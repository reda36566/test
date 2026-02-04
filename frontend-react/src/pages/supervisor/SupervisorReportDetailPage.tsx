import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowLeft, Download, CheckCircle, XCircle, Clock, 
  User, FileText, Loader2, GraduationCap, ShieldAlert, AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';

const API_URL = 'http://localhost:3000';

export default function SupervisorReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useAdminPlatformSettings();
  
  const [rapport, setRapport] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [etudiant, setEtudiant] = useState<any>(null);
  const [plagiat, setPlagiat] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Charger les données
  const fetchData = async () => {
    try {
      const resRapport = await api.get(`/api/rapports/${id}`);
      const dataRapport = resRapport.data;
      setRapport(dataRapport);

      const resVersions = await api.get(`/api/rapports/${id}/versions`);
      setVersions(resVersions.data);

      if (dataRapport.id_etudiant) {
        const resEtud = await api.get(`/api/etudiants/${dataRapport.id_etudiant}`);
        setEtudiant(resEtud.data);
      }

      const resPlagiat = await api.get(`/api/rapports/${id}/plagiat`);
      setPlagiat(resPlagiat.data);

    } catch (error) {
      console.error("Erreur chargement", error);
      toast.error("Impossible de charger le rapport");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const getPlagiatStatus = (score: number) => {
    if (score >= settings.plagiarism.alertThreshold) {
      return { color: 'text-red-600 bg-red-50 border-red-200', label: settings.plagiarism.riskLabels.high, icon: <ShieldAlert className="h-4 w-4" /> };
    }
    if (score >= Math.max(0, settings.plagiarism.alertThreshold - 15)) {
      return { color: 'text-orange-600 bg-amber-50 border-amber-200', label: settings.plagiarism.riskLabels.medium, icon: <AlertTriangle className="h-4 w-4" /> };
    }
    return { color: 'text-green-600 bg-green-50 border-green-200', label: settings.plagiarism.riskLabels.low, icon: <CheckCircle className="h-4 w-4" /> };
  };

  const handleUpdateStatus = async (newStatusId: number) => {
    setActionLoading(true);
    try {
      await api.post('/api/encadrant/valider', {
        id_rapport: id,
        id_statut: newStatusId
      });
      const statusText = newStatusId === 3 ? "validé" : "renvoyé pour correction";
      toast.success(`Le rapport a été ${statusText} !`);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (statusId: number) => {
    if (statusId === 1) return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold border border-blue-200">Soumis</span>;
    if (statusId === 3) return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold border border-green-200">Validé</span>;
    if (statusId === 2) return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200">À corriger</span>;
    return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">Inconnu</span>;
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary"/></div>;
  if (!rapport) return <div className="p-10 text-center">Rapport introuvable</div>;
  const showPlagiarism = settings.plagiarism.showColumnSupervisor;

  return (
    <AppLayout>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord
      </Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{rapport.titre}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Étudiant : <span className="font-semibold text-foreground">{etudiant ? `${etudiant.nom} ${etudiant.prenom}` : 'Chargement...'}</span></span>
            <span>•</span>
            <span>{etudiant?.filiere || 'Génie Informatique'}</span>
          </div>
        </div>
        <div>{getStatusBadge(rapport.id_statut)}</div> {/* Correction mineure: utilise l'ID pour le badge */}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* COLONNE GAUCHE : VERSIONS & PLAGIAT */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Fichiers soumis
              </CardTitle>
              {showPlagiarism && plagiat && (
                <Badge variant={plagiat.score_similitude >= 30 ? "destructive" : "outline"}>
                   Analyse Plagiat : {plagiat.score_similitude}%
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {showPlagiarism && plagiat && (
                <div className={`p-4 rounded-lg border-2 mb-4 ${getPlagiatStatus(plagiat.score_similitude).color}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getPlagiatStatus(plagiat.score_similitude).icon}
                      <span className="font-bold">Analyse de similitude : {getPlagiatStatus(plagiat.score_similitude).label}</span>
                    </div>
                    <span className="text-2xl font-black">{plagiat.score_similitude}%</span>
                  </div>
                </div>
              )}

              {versions.length === 0 ? (
                <p className="text-muted-foreground">Aucun fichier disponible.</p>
              ) : (
                <div className="space-y-4">
                  {versions.map((v) => (
                    <div key={v.id_version} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded flex items-center justify-center font-bold text-lg ${v.numero_version === versions[0].numero_version ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                          V{v.numero_version}
                        </div>
                        <div>
                          <p className="font-medium">Version {v.numero_version}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3"/>
                            Déposé le {format(new Date(v.date_depot), 'dd/MM/yyyy à HH:mm')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(`${API_URL}/uploads/${v.fichier_path}`, '_blank')}>
                        <Download className="mr-2 h-4 w-4"/> Voir / Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE : ACTIONS DU PROF */}
        <div className="space-y-6">
           <Card className="border-l-4 border-l-primary shadow-md">
            <CardHeader><CardTitle>Évaluation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                {versions.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full mb-2 border-blue-600 text-blue-600 hover:bg-blue-50 h-12"
                    onClick={() => window.open(`${API_URL}/uploads/${versions[0].fichier_path}`, '_blank')}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Lire le rapport (PDF)
                  </Button>
                )}

                <Separator className="my-2" />

                <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => handleUpdateStatus(3)} 
                    disabled={actionLoading || rapport.id_statut === 3}
                >
                    {actionLoading ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Valider le rapport
                </Button>

                <Button 
                    variant="outline" 
                    className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50" 
                    onClick={() => handleUpdateStatus(2)} 
                    disabled={actionLoading || rapport.id_statut === 2 || rapport.id_statut === 3}
                >
                    {actionLoading ? <Loader2 className="animate-spin mr-2"/> : <XCircle className="mr-2 h-4 w-4" />}
                    Demander des corrections
                </Button>

                <Button variant="secondary" className="w-full mt-4 bg-slate-800 text-white hover:bg-slate-700" onClick={() => navigate(`/supervisor/evaluation/${id}`)}>
                    <GraduationCap className="mr-2 h-4 w-4" /> Accéder à la notation
                </Button>
            </CardContent>
           </Card>

           <Card>
             <CardHeader><CardTitle className="text-sm">Infos Sujet</CardTitle></CardHeader>
             <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                    <span>Type:</span>
                    {/* ✅ CORRECTION ICI : Affichage dynamique du type */}
                    <Badge variant="secondary">{rapport.type_libelle || 'Non défini'}</Badge>
                </div>
                
                <div className="flex justify-between">
                    <span>Entreprise:</span>
                    <span className="font-medium text-right">
                        {rapport.nom_entreprise || <span className="text-muted-foreground italic">Non spécifiée</span>}
                    </span>
                </div>
                
                <div className="flex justify-between">
                    <span>Année:</span>
                    <span className="font-medium">
                        {rapport.annee_libelle || 'Non définie'}
                    </span>
                </div>
            </CardContent>
           </Card>
        </div>
      </div>
    </AppLayout>
  );
}
