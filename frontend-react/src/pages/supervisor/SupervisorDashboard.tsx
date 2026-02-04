import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { FileText, Clock, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api'; 
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const getStatusBadge = (id_statut: number, label_texte: string) => {
  if (id_statut === 3) {
    return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase">Validé</span>;
  }
  if (id_statut === 4) {
    return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 uppercase">À corriger</span>;
  }
  return (
    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
      {label_texte || 'Soumis'}
    </span>
  );
};

// ✅ FONCTION AJOUTÉE : Badge pour le plagiat
const getPlagiatBadge = (score: number, alertThreshold: number, labels: { low: string; medium: string; high: string }) => {
  if (score >= alertThreshold) {
    return <Badge variant="destructive" className="ml-2">{labels.high}: {score}%</Badge>;
  }
  if (score >= Math.max(0, alertThreshold - 15)) {
    return (
      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
        {labels.medium}: {score}%
      </Badge>
    );
  }
  return null;
};

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const { settings } = useAdminPlatformSettings();
  const [rapports, setRapports] = useState<any[]>([]);
  const [plagiats, setPlagiats] = useState<any[]>([]); // État pour les scores de plagiat
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const userId = (user as any)?.id_specifique || (user as any)?.id_encadrant;
      if (userId) {
        try {
          // Chargement des rapports et des scores de plagiat en parallèle
          const [resRapports, resPlagiats] = await Promise.all([
            api.get(`/api/encadrant/rapports?id_encadrant=${userId}`),
            api.get('/api/admin/plagiat').catch(() => ({ data: [] }))
          ]);
          
          setRapports(Array.isArray(resRapports.data) ? resRapports.data : []);
          setPlagiats(Array.isArray(resPlagiats.data) ? resPlagiats.data : []);
        } catch (error) {
          console.error("Erreur API", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const safeDate = (d: any) => {
    try {
      if (!d) return '-';
      return format(new Date(d), 'dd MMM yyyy', { locale: fr });
    } catch { return '-'; }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div>;

  const pending = rapports.filter(r => r?.id_statut === 1); 
  const showPlagiarism = settings.plagiarism.showColumnSupervisor;
  const plagiarismLabels = settings.plagiarism.riskLabels;
  const alertThreshold = settings.plagiarism.alertThreshold;

  return (
    <AppLayout>
      <PageHeader
        title={`Espace Professeur`}
        description="Tableau de bord de suivi des étudiants."
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="p-4 bg-white border rounded shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">Total Rapports</p>
                <p className="text-2xl font-bold">{rapports.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500 opacity-20" />
        </div>
        <div className="p-4 bg-white border rounded shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">À Valider</p>
                <p className="text-2xl font-bold">{pending.length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
        </div>
      </div>

      {pending.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 text-base">
              <AlertTriangle className="h-5 w-5" /> Actions requises
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((r) => {
              // On cherche si un score de plagiat existe pour ce rapport
              const plagiat = plagiats.find(p => p.id_rapport === r.id_rapport);
              return (
                <div key={r.id_rapport} className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded">
                        <FileText className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">{r.titre}</p>
                        <p className="text-xs text-gray-500">{r.nom_etudiant} {r.prenom_etudiant} • {r.type_rapport}</p>
                    </div>
                    {/* Alerte visuelle immédiate si plagiat critique */}
                    {showPlagiarism && plagiat && plagiat.score_similitude >= alertThreshold && (
                      <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {showPlagiarism && plagiat && getPlagiatBadge(plagiat.score_similitude, alertThreshold, plagiarismLabels)}
                    <Link to={`/supervisor/evaluation/${r.id_rapport}`} className="text-blue-600 font-semibold hover:underline text-sm flex items-center gap-1">
                        Examiner &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tous les rapports récents</CardTitle>
        </CardHeader>
        <CardContent>
            {rapports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun rapport reçu.</p>
            ) : (
                <div className="divide-y">
                    {rapports.map((r) => {
                        const plagiat = plagiats.find(p => p.id_rapport === r.id_rapport);
                        return (
                            <div key={r.id_rapport} className="flex justify-between items-center py-4 px-2 hover:bg-slate-50/50 transition-colors">
                                <div className="flex gap-4 items-center">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                        {r.nom_etudiant?.[0]}{r.prenom_etudiant?.[0]}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{r.titre || 'Sans titre'}</div>
                                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                            <span className="font-medium text-slate-700">{r.nom_etudiant} {r.prenom_etudiant}</span>
                                            <span>•</span>
                                            {safeDate(r.date_depot)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {showPlagiarism && plagiat && getPlagiatBadge(plagiat.score_similitude, alertThreshold, plagiarismLabels)}
                                    {getStatusBadge(r.id_statut, r.statut_label)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
