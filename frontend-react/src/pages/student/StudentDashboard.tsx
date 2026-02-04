import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, Plus, CheckCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { settings } = useAdminPlatformSettings();
  const [rapports, setRapports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // CHARGER LES RAPPORTS DEPUIS LA BDD
  useEffect(() => {
    const fetchRapports = async () => {
      // On récupère l'ID spécifique (celui de la table 'etudiants')
      const userId = (user as any)?.id_specifique || (user as any)?.id_etudiant;
      
      if (userId) {
        try {
          // ✅ CORRECTION ICI : On ajoute /api au début du chemin
          const res = await api.get(`/api/etudiant/rapports?id_etudiant=${userId}`); 
          
          console.log("Rapports reçus:", res.data); // Pour vérifier dans la console (F12)
          setRapports(res.data || []);
        } catch (error) {
          console.error("Erreur chargement:", error);
        } finally {
          setLoading(false);
        }
      } else {
          setLoading(false);
      }
    };
    fetchRapports();
  }, [user]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <AppLayout>
      <PageHeader
        title={`Bonjour, ${(user as any)?.login || 'Étudiant'} !`}
        description="Espace Étudiant"
        actions={
          settings.roleUi.student.showNewDepositButton && (
            <Button asChild>
              <Link to="/student/report/create">
                <Plus className="mr-2 h-4 w-4" /> Nouveau rapport
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
  <StatCard title="Total Déposés" value={rapports.length} icon={FileText} variant="primary" />
  
  {/* ✅ Compte maintenant l'ID 3 (Validé) */}
  <StatCard title="Validés" value={rapports.filter(r => r.id_statut === 3).length} icon={CheckCircle} variant="success" />
  
  {/* ✅ Compte l'ID 2 (Soumis/En attente) */}
  <StatCard title="En attente" value={rapports.filter(r => r.id_statut === 2).length} icon={Clock} variant="warning" />
</div>

      <Card>
        <CardHeader>
          <CardTitle>Mes Rapports</CardTitle>
        </CardHeader>
        <CardContent>
          {rapports.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground mb-4">Aucun rapport trouvé.</p>
              {settings.roleUi.student.showNewDepositButton && (
                <Link to="/student/report/create"><Button>Créer le premier</Button></Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {rapports.map((rapport) => (
                <div key={rapport.id_rapport} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-lg">{rapport.titre}</div>
                    <div className="text-sm text-gray-500">
                      Encadrant : {rapport.nom_encadrant ? `Prof. ${rapport.nom_encadrant}` : 'Non assigné'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${rapport.id_statut === 3 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {rapport.statut_libelle || (rapport.id_statut === 2 ? 'Soumis' : 'En cours')}
                    </span>
                    <Link to={`/student/report/${rapport.id_rapport}`}>
                        <Button variant="outline" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
