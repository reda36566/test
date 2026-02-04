import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Search, CheckCircle, RefreshCcw, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
// 👇 IMPORT DU MODULE DE RECHERCHE
import GlobalSearch from "@/components/GlobalSearch";

export default function SupervisorReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rapports, setRapports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 1. CHARGEMENT
  const fetchRapports = async () => {
    const userId = (user as any)?.id_specifique || (user as any)?.id_encadrant;
    
    if (userId) {
      try {
        const res = await api.get(`/api/encadrant/rapports?id_encadrant=${userId}`);
        setRapports(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Erreur chargement liste rapports", error);
        toast.error("Impossible de charger les rapports");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, [user]);

  // 2. ACTIONS RAPIDES
  const handleQuickAction = async (rapportId: number, action: 'validate' | 'corrections') => {
    const newStatus = action === 'validate' ? 3 : 2;
    const actionText = action === 'validate' ? "validé" : "marqué à corriger";

    try {
      await api.post('/api/encadrant/valider', {
        id_rapport: rapportId,
        id_statut: newStatus,
        id_user_prof: (user as any)?.id_user 
      });
      
      toast.success(`Rapport ${actionText} avec succès !`);
      fetchRapports();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'action");
    }
  };

  // 3. UTILITAIRES STATUT
  const getStatusBadge = (id_statut: number, label_texte: string) => {
    if (id_statut === 3) {
      return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Validé</span>;
    }
    if (id_statut === 2) {
      return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">À corriger</span>;
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
        {label_texte || 'Soumis'}
      </span>
    );
  };

  const safeDate = (d: any) => {
    try {
      if (!d) return '-';
      return format(new Date(d), 'dd/MM/yyyy', { locale: fr });
    } catch { return '-'; }
  };

  // 4. FILTRES
  const filteredReports = useMemo(() => {
    return rapports.filter(r => {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        (r.titre || '').toLowerCase().includes(searchLower) ||
        (r.nom_etudiant || '').toLowerCase().includes(searchLower) ||
        (r.prenom_etudiant || '').toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || 
        (r.statut_label || '').toLowerCase().includes(statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [rapports, search, statusFilter]);

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary"/></div>;

  return (
    <AppLayout>
      <PageHeader
        title="Rapports à évaluer"
        description="Gérez et validez les rapports de vos étudiants."
      />

      {/* 👇 MODULE DE RECHERCHE FULL-TEXT (STYLE HARMONISÉ) 👇 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-600" />
            Recherche dans le contenu (Full-Text)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <GlobalSearch />
            </div>
            <p className="text-xs text-muted-foreground">
              Cette recherche analyse le texte à l'intérieur des fichiers PDF pour trouver des mots-clés spécifiques.
            </p>
          </div>
        </CardContent>
      </Card>
      {/* 👆 FIN MODULE RECHERCHE 👆 */}

      {/* ZONE FILTRES */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtres rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Filtrer par titre ou nom d'étudiant..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-10 w-full"
             />
          </div>
          <div className="space-y-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="soumis">En attente</SelectItem>
                <SelectItem value="valid">Validés</SelectItem>
                <SelectItem value="corr">À corriger</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TABLEAU */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rapport</TableHead>
                <TableHead>Étudiant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucun rapport trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((r) => (
                  <TableRow key={r.id_rapport} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium max-w-[200px] truncate" title={r.titre}>
                        {r.titre}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.nom_etudiant} {r.prenom_etudiant}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                        {r.type_rapport || 'PFE'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(r.id_statut, r.statut_label)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {safeDate(r.date_depot)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/supervisor/evaluation/${r.id_rapport}`)} title="Détails / Noter">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        
                        {r.id_statut !== 3 && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleQuickAction(r.id_rapport, 'validate')} title="Valider">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleQuickAction(r.id_rapport, 'corrections')} title="Demander corrections">
                              <RefreshCcw className="h-4 w-4 text-orange-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}