import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  FileText, Users, UserCog, GraduationCap, 
  CheckCircle, Clock, AlertTriangle, 
  ArrowRight, Loader2, Activity, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { exportToCsv } from '@/lib/csv';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const getExportAuthHeaders = () => {
    try {
      const storedSession = localStorage.getItem('ensa_pfe_session_v4');
      if (!storedSession) return {};
      const session = JSON.parse(storedSession);
      return {
        'X-User-Id': String(session?.id_user ?? ''),
        'X-User-Role': String(session?.role ?? ''),
      };
    } catch (error) {
      console.error('Erreur lecture session export', error);
      return {};
    }
  };

useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      console.log("Données reçues :", res.data); // 👈 Regardez la console (F12)
      setData(res.data);
    } catch (error) {
      console.error("Erreur API :", error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
  // ✅ SÉCURITÉ : Chargement
  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </AppLayout>
    );
  }

  // ✅ SÉCURITÉ : Vérification de la structure des données
  if (!data || !data.counts) {
    return (
      <AppLayout>
        <div className="p-8 text-red-500 bg-red-50 rounded-lg border border-red-200">
          Erreur : Impossible de charger les données du serveur.
        </div>
      </AppLayout>
    );
  }

// Extraction des données backend
const stats = data.counts;
const reportsByType = data.charts?.byType || [];

// ✅ Vérifiez que ces noms correspondent à votre res.json() du backend
const validatedCount = stats.valides || 0; 
const pendingCount = stats.en_attente || stats.enAttente || 0; // Vérifiez l'orthographe (en_attente vs enAttente)

 // ✅ Couleurs synchronisées avec vos IDs de base de données
const statusMap: Record<string, string> = {
  'Validé': '#22c55e',      // Vert (ID 3)
  'Soumis': '#3b82f6',      // Bleu (ID 2)
  'À corriger': '#f59e0b',  // Orange/Jaune (ID 4) 👈 AJOUTEZ CECI
  'Brouillon': '#94a3b8',   // Gris (ID 1)
  'Autres': '#cbd5e1'
};

  const reportsByStatus = (data.charts?.byStatus || []).map((item: any) => ({
  name: item.name,
  value: item.value,
  color: statusMap[item.name] || '#cbd5e1'
}));

  const handleExportDashboardCsv = async () => {
    setExportLoading(true);
    try {
      const res = await api.get('/api/admin/export/students-full', {
        headers: getExportAuthHeaders(),
      });
      if (!Array.isArray(res.data)) {
        throw new Error('Invalid export data');
      }
      const rows = res.data;
      if (rows.length === 0) {
        toast.info('Aucune donnée à exporter.');
        return;
      }
      const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      exportToCsv({
        filename: `students_reports_${dateStamp}.csv`,
        rows,
        columns: [
          { key: 'student_id', header: 'student_id' },
          { key: 'student_nom', header: 'student_nom' },
          { key: 'student_prenom', header: 'student_prenom' },
          { key: 'student_email', header: 'student_email' },
          { key: 'report_id', header: 'report_id' },
          { key: 'report_titre', header: 'report_titre' },
          { key: 'report_type', header: 'report_type' },
          { key: 'report_statut', header: 'report_statut' },
          { key: 'report_note', header: 'report_note' },
          { key: 'date_depot', header: 'date_depot' },
          { key: 'date_modification', header: 'date_modification' },
          { key: 'annee_academique', header: 'annee_academique' },
          { key: 'entreprise', header: 'entreprise' },
          { key: 'encadrant_id', header: 'encadrant_id' },
          { key: 'encadrant_nom', header: 'encadrant_nom' },
          { key: 'encadrant_prenom', header: 'encadrant_prenom' },
          { key: 'encadrant_email', header: 'encadrant_email' },
          { key: 'plagiat_score', header: 'plagiat_score' },
          { key: 'plagiat_statut', header: 'plagiat_statut' },
          { key: 'plagiat_date', header: 'plagiat_date' },
          { key: 'last_version_number', header: 'last_version_number' },
          { key: 'last_file_name', header: 'last_file_name' },
        ],
      });
      toast.success('CSV exporté avec succès.');
    } catch (error) {
      console.error('Erreur export CSV', error);
      toast.error("Impossible d'exporter les données.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Tableau de bord administrateur"
        description="Vue d'ensemble et pilotage du système."
        actions={(
          <Button onClick={handleExportDashboardCsv} disabled={exportLoading}>
            {exportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter .CSV
          </Button>
        )}
      />

      {/* 1. STATS PRINCIPALES (Rapports, Étudiants, Profs, Users) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-l-4 border-l-blue-600 bg-blue-50/20 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Rapports</p>
              <div className="text-2xl font-bold">{stats.rapports}</div>
            </div>
            <FileText className="h-8 w-8 text-blue-600 opacity-60" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-600 bg-green-50/20 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Étudiants</p>
              <div className="text-2xl font-bold">{stats.etudiants}</div>
            </div>
            <GraduationCap className="h-8 w-8 text-green-600 opacity-60" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-600 bg-purple-50/20 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Encadrants</p>
              <div className="text-2xl font-bold">{stats.encadrants}</div>
            </div>
            <UserCog className="h-8 w-8 text-purple-600 opacity-60" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-600 bg-slate-50/20 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Utilisateurs</p>
              <div className="text-2xl font-bold">{stats.users}</div>
            </div>
            <Users className="h-8 w-8 text-slate-600 opacity-60" />
          </CardContent>
        </Card>
      </div>

      {/* 2. STATS SECONDAIRES (Grille à 3 colonnes demandée) */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="bg-white p-4 rounded-lg border flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-green-100 rounded-full"><CheckCircle className="h-5 w-5 text-green-600"/></div>
          <div><p className="text-xs text-gray-500">Rapports Validés</p><p className="font-bold text-lg">{validatedCount}</p></div>
        </div>

        <div className="bg-white p-4 rounded-lg border flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-yellow-100 rounded-full"><Clock className="h-5 w-5 text-yellow-600"/></div>
          <div><p className="text-xs text-gray-500">En attente d'évaluation</p><p className="font-bold text-lg">{pendingCount}</p></div>
        </div>

        <div className="bg-white p-4 rounded-lg border flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-red-100 rounded-full"><AlertTriangle className="h-5 w-5 text-red-600"/></div>
          <div><p className="text-xs text-gray-500">Plagiats (Critiques)</p><p className="font-bold text-lg">{data.counts.plagiatCritique || 0}</p></div>
        </div>
      </div>

      {/* 3. GRAPHIQUES */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Rapports par type</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportsByType}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">État d'avancement</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportsByStatus}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={5} dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {reportsByStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. ACTIVITÉ RÉCENTE */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4"/> Activité Récente</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity?.length === 0 ? (
                <p className="text-muted-foreground text-xs italic">Aucune action enregistrée.</p>
              ) : (
                data.recentActivity.map((log: any, i: number) => (
                  <div key={i} className="flex items-start justify-between border-b border-slate-50 pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{log.details}</p>
                      <p className="text-[11px] text-muted-foreground">Par {log.login} • {log.type_action}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {format(new Date(log.date_action), 'dd/MM HH:mm', { locale: fr })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Link to="/admin/users">
            <Card className="hover:border-blue-300 transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Utilisateurs</h3>
                  <p className="text-[11px] text-muted-foreground">Gérer les comptes</p>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-500"/>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/reports">
            <Card className="hover:border-purple-300 transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Rapports</h3>
                  <p className="text-[11px] text-muted-foreground">Supervision globale</p>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-500"/>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
