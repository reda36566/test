import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { toast } from 'sonner';
// AJOUT : Toutes les icônes nécessaires pour correspondre à votre photo
import { 
  Save, ArrowLeft, GraduationCap, Loader2, XCircle, 
  FileText, ShieldAlert, CheckCircle, AlertTriangle, 
  User, Clock, Download 
} from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

const API_URL = 'http://localhost:3000';

export default function SupervisorEvaluationPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings } = useAdminPlatformSettings();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // États pour les données
  const [rapport, setRapport] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [etudiant, setEtudiant] = useState<any>(null);
  const [plagiat, setPlagiat] = useState<any>(null);

  const [note, setNote] = useState('');
  const [commentaire, setCommentaire] = useState('');

  // 1. Chargement complet des données en parallèle
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resRapport, resVersions, resPlagiat] = await Promise.all([
          api.get(`/api/rapports/${id}`),
          api.get(`/api/rapports/${id}/versions`),
          api.get(`/api/admin/plagiat`).catch(() => ({ data: [] }))
        ]);

        const dataRapport = resRapport.data;
        setRapport(dataRapport);
        setVersions(resVersions.data || []);
        
        // Trouver le score de plagiat pour ce rapport spécifique
        const score = resPlagiat.data.find((p: any) => p.id_rapport == id);
        setPlagiat(score);

        // Charger les informations détaillées de l'étudiant
        if (dataRapport.id_etudiant) {
          const resEtud = await api.get(`/api/etudiants/${dataRapport.id_etudiant}`);
          setEtudiant(resEtud.data);
        }
        
        if (dataRapport.note) setNote(dataRapport.note);
        if (dataRapport.commentaire_encadrant) setCommentaire(dataRapport.commentaire_encadrant);
        
      } catch (error) {
        console.error("Erreur chargement evaluation:", error);
        toast.error("Impossible de charger les détails de l'évaluation");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  // Logique de couleur pour le score de plagiat
  const getPlagiatStatus = (score: number) => {
    if (score >= settings.plagiarism.alertThreshold) {
      return { color: 'text-red-600 bg-red-50 border-red-200', label: settings.plagiarism.riskLabels.high, icon: <ShieldAlert className="h-4 w-4" /> };
    }
    if (score >= Math.max(0, settings.plagiarism.alertThreshold - 15)) {
      return { color: 'text-orange-600 bg-amber-50 border-amber-200', label: settings.plagiarism.riskLabels.medium, icon: <AlertTriangle className="h-4 w-4" /> };
    }
    return { color: 'text-green-600 bg-green-50 border-green-200', label: settings.plagiarism.riskLabels.low, icon: <CheckCircle className="h-4 w-4" /> };
  };

  const handleSubmit = async () => {
  // 1. BLOCAGE SI PLAGIAT 100%
  if (plagiat && plagiat.score_similitude >= 100) {
    toast.error("Validation impossible : Ce rapport est un plagiat à 100%. Vous devez demander des corrections.");
    return;
  }

  const noteValue = parseFloat(note);
  if (!note || isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
    toast.error("Veuillez saisir une note valide entre 0 et 20");
    return;
  }

  setSubmitting(true);
  try {
    await api.post('/api/encadrant/noter', {
      id_rapport: id,
      note: noteValue,
      commentaire: commentaire,
      id_user_prof: (user as any)?.id_user
    });
    toast.success("Évaluation enregistrée avec succès !");
    navigate('/supervisor/dashboard');
  } catch (error) {
    toast.error("Erreur lors de l'enregistrement");
    setSubmitting(false);
  }
};

  const handleRefuse = async () => {
    if (!commentaire) { toast.error("Un commentaire est requis pour demander des corrections"); return; }
    setSubmitting(true);
    try {
        await api.post('/api/encadrant/valider', { 
            id_rapport: id, 
            id_statut: 2, 
            commentaire: commentaire, 
            id_user_prof: (user as any)?.id_user 
        });
        toast.warning("Rapport renvoyé pour corrections.");
        navigate('/supervisor/dashboard');
    } catch (error) { toast.error("Erreur lors de l'action"); setSubmitting(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary"/></div>;

  return (
    <AppLayout>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 transition-all hover:pl-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord
      </Button>

      <div className="flex justify-between items-start mb-6">
        <PageHeader 
          title={`Examen : ${rapport?.titre}`} 
          description={`Étudiant : ${etudiant ? `${etudiant.nom} ${etudiant.prenom}` : 'Chargement...'}`}
        />
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3 py-1">Soumis</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* COLONNE GAUCHE : DOCUMENTS ET PLAGIAT */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-blue-600" /> Fichiers soumis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {versions.length > 0 ? (
                versions.map((v) => (
                  <div key={v.id_version} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold">V{v.numero_version}</div>
                      <div>
                        <p className="text-sm font-medium">Rapport version {v.numero_version}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {format(new Date(v.date_depot), 'dd/MM/yyyy à HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.open(`${API_URL}/uploads/${v.fichier_path}`, '_blank')}>
                      <Download className="mr-2 h-4 w-4" /> Voir le document
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">Aucun fichier disponible.</div>
              )}

              <Separator className="my-4" />

              {/* SECTION PLAGIAT */}
              {settings.plagiarism.showColumnSupervisor && (
                <div>
                  <Label className="text-xs font-bold uppercase text-muted-foreground mb-3 block tracking-tight">Analyse anti-plagiat</Label>
                  {plagiat ? (
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${getPlagiatStatus(plagiat.score_similitude).color}`}>
                      <div className="flex items-center gap-3">
                        {getPlagiatStatus(plagiat.score_similitude).icon}
                        <span className="font-bold">{getPlagiatStatus(plagiat.score_similitude).label}</span>
                      </div>
                      <div className="text-2xl font-black">{plagiat.score_similitude}%</div>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground italic">
                      Analyse automatique en attente...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE : NOTATION ET SUJET */}
        <div className="space-y-6">
          <Card className="border-t-4 border-t-primary shadow-lg">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5"/> Évaluation</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Note finale (/20)</Label>
                <Input type="number" step="0.25" value={note} onChange={(e) => setNote(e.target.value)} className="text-2xl font-bold h-12 border-blue-200" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <Label>Commentaires de l'encadrant</Label>
                <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className="min-h-[150px]" placeholder="Justifiez votre note ou expliquez les corrections nécessaires..." />
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Button 
  className="w-full bg-green-600 hover:bg-green-700" 
  onClick={handleSubmit} 
  disabled={submitting || (plagiat?.score_similitude >= 100)} // ✅ Désactivation auto
>
  {submitting ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle className="mr-2 h-4 w-4"/>} 
  Valider et Noter
</Button>
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={handleRefuse} disabled={submitting}>
                   <XCircle className="mr-2 h-4 w-4"/> Demander des corrections
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-bold uppercase text-muted-foreground">Résumé du sujet</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-3">
               <div className="flex justify-between border-b pb-2"><span>Type:</span><Badge variant="secondary">{rapport?.id_type === 1 ? 'PFE' : 'PFA'}</Badge></div>
               <div className="flex justify-between border-b pb-2"><span>Entreprise:</span><span className="font-medium">OCP (Safi)</span></div>
               <div className="flex justify-between"><span>Année:</span><span className="font-medium">2025-2026</span></div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
