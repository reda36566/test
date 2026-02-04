import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Clock, Download, Loader2, GraduationCap, Quote, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { ReportLifecycleStepper } from '@/components/common/ReportLifecycleStepper';

// URL de base pour télécharger les fichiers (Doit correspondre à votre serveur)
const API_URL = 'http://localhost:3000';

export default function StudentReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useAdminPlatformSettings();
  
  const [rapport, setRapport] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 1. Charger les infos
  const fetchData = async () => {
    try {
      // On utilise /api pour être sûr de passer par notre config axios
      const [resRapport, resVersions] = await Promise.all([
        api.get(`/api/rapports/${id}`),
        api.get(`/api/rapports/${id}/versions`)
      ]);
      setRapport(resRapport.data);
      setVersions(resVersions.data);
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

  // 2. Upload Nouvelle Version
  const handleUploadVersion = async () => {
    if (!file) return toast.error("Veuillez sélectionner un fichier PDF");
    
    setUploading(true);
    const formData = new FormData();
    formData.append('rapport', file);

    try {
      await api.post(`/api/rapports/${id}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success("Nouvelle version envoyée !");
      setFile(null);
      fetchData(); // On recharge la liste
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  };

const getStatusBadge = (status: string) => {
  const s = (status || '').trim();
  let colorClass = "bg-gray-100 text-gray-800"; // ✅ Toujours déclarer ici

  if (s === 'Validé') colorClass = "bg-green-100 text-green-800";
  else if (s === 'Soumis') colorClass = "bg-blue-100 text-blue-800";
  else if (s === 'À corriger' || s === 'En cours de correction') colorClass = "bg-yellow-100 text-yellow-800";

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${colorClass}`}>
      {s || 'Inconnu'}
    </span>
  );
};

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto"/></div>;
  if (!rapport) return <div className="p-10">Rapport introuvable</div>;

  return (
    <AppLayout>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>

      <PageHeader 
        title={rapport.titre} 
        description={`Dernière modification : ${format(new Date(rapport.date_modification || rapport.date_depot), 'dd/MM/yyyy HH:mm')}`}
        actions={getStatusBadge(rapport.statut_libelle)}
      />

      <div className="mt-6">
        <ReportLifecycleStepper
          statusId={rapport.id_statut}
          statusLabel={rapport.statut_libelle || rapport.statut_label}
          versions={versions}
        />
      </div>

    <div className="grid gap-6 md:grid-cols-3 mt-6">
      
      {/* COLONNE GAUCHE : DÉTAILS & UPLOAD */}
      <div className="md:col-span-2 space-y-6">
          {settings.roleUi.student.showTimelineSection && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Statut actuel</span>
                  <span className="font-medium text-foreground">{rapport.statut_libelle || 'Inconnu'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date de dépôt</span>
                  <span className="font-medium text-foreground">
                    {rapport.date_depot ? format(new Date(rapport.date_depot), 'dd/MM/yyyy HH:mm') : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dernière modification</span>
                  <span className="font-medium text-foreground">
                    {rapport.date_modification ? format(new Date(rapport.date_modification), 'dd/MM/yyyy HH:mm') : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Section Upload Nouvelle Version (Seulement si NON validé et ID_STATUT === 2) */}
          {/* ✅ AJOUT ICI : Condition pour afficher si statut 2 */}
          {(rapport.id_statut === 2 || rapport.id_statut === 1) && (
            <Card className={`border-primary/20 ${rapport.id_statut === 2 ? 'bg-yellow-50 border-yellow-200' : 'bg-primary/5'}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                    {rapport.id_statut === 2 && <AlertTriangle className="h-5 w-5 text-yellow-600"/>}
                    <CardTitle className="text-lg">
                        {rapport.id_statut === 2 ? "Correction demandée : Déposer une nouvelle version" : "Déposer une nouvelle version"}
                    </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {rapport.id_statut === 2 && (
                    <p className="text-sm text-yellow-800 mb-4 font-medium">
                        Votre encadrant a demandé des corrections. Veuillez uploader la version corrigée ci-dessous.
                    </p>
                )}
                <div className="flex gap-4 items-end">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="version">Fichier correctif (PDF)</Label>
                    <Input 
                        id="version" 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                        className="bg-white"
                    />
                  </div>
                  <Button onClick={handleUploadVersion} disabled={!file || uploading}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                    Envoyer V{versions.length + 1}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des Versions */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.map((v) => (
                  <div key={v.id_version} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                        V{v.numero_version}
                      </div>
                      <div>
                        <p className="font-medium">Version {v.numero_version}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3"/>
                          {format(new Date(v.date_depot), 'dd MMM yyyy à HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    <a 
                        href={`${API_URL}/uploads/${v.fichier_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:underline"
                    >
                      <Download className="mr-2 h-4 w-4"/> Télécharger
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE : RÉSULTATS & INFO PROF */}
        <div className="space-y-6">
           
           {/* === BLOC : AFFICHAGE DE LA NOTE === */}
           {rapport.note && (
             <Card className="border-green-500 bg-green-50 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-800">
                        <GraduationCap className="h-5 w-5" />
                        Résultat & Évaluation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Note Finale</p>
                        <div className="text-4xl font-extrabold text-green-900">
                            {rapport.note} <span className="text-xl text-green-600 font-medium">/ 20</span>
                        </div>
                    </div>

                    {rapport.commentaire_encadrant && (
                        <div className="bg-white/80 p-3 rounded-md border border-green-200">
                            <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Quote className="h-3 w-3"/> Commentaire de l'encadrant
                            </p>
                            <p className="text-sm text-gray-700 italic">
                                "{rapport.commentaire_encadrant}"
                            </p>
                        </div>
                    )}
                </CardContent>
             </Card>
           )}
           {/* =========================================== */}

           <Card>
            <CardHeader>
                <CardTitle className="text-base">Encadrement</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-sm">
                    <p className="text-muted-foreground">Encadrant assigné</p>
                    <p className="font-medium text-lg mb-4">Prof. Principal</p>
                    
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium mb-4">prof@ensa.ma</p>

                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium">{rapport.id_type === 1 ? 'PFE' : 'PFA'}</p>
                </div>
            </CardContent>
           </Card>
        </div>

      </div>
    </AppLayout>
  );
}
