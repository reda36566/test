import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Download, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import api from '@/lib/api';
import { exportToCsv } from '@/lib/csv';
// 👇 IMPORT DU MODULE DE RECHERCHE
import GlobalSearch from "@/components/GlobalSearch";

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const { settings } = useAdminPlatformSettings();
  const [reports, setReports] = useState<any[]>([]);
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

  // États des filtres
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // 1. Charger les données réelles depuis l'API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/api/admin/reports');
        setReports(res.data);
      } catch (error) {
        console.error("Erreur chargement rapports", error);
        toast.error("Impossible de charger les rapports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // 2. Filtrage côté client
  const filteredReports = useMemo(() => {
    return reports.filter((rapport) => {
      // Recherche (Titre ou Nom étudiant)
      const searchLower = search.toLowerCase();
      const matchesSearch =
        rapport.titre.toLowerCase().includes(searchLower) ||
        (rapport.nom_etudiant && rapport.nom_etudiant.toLowerCase().includes(searchLower)) ||
        (rapport.prenom_etudiant && rapport.prenom_etudiant.toLowerCase().includes(searchLower));

      // Filtre Statut
      const matchesStatus = selectedStatus === 'all' || rapport.statut === selectedStatus;
      
      // Filtre Type
      const matchesType = selectedType === 'all' || rapport.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, selectedStatus, selectedType, reports]);

  // Helper pour les couleurs de badge
  const getStatusColor = (status: string) => {
    const s = (status || '').trim(); 
    switch(s) {
        case 'Validé': 
            return 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
        case 'Soumis': 
            return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
        case 'À corriger': 
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200';
        case 'Refusé': 
            return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
        default: 
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleExportReports = async () => {
    setExportLoading(true);
    try {
      const res = await api.get('/api/admin/export/reports', {
        headers: getExportAuthHeaders(),
      });
      if (!Array.isArray(res.data)) throw new Error('Invalid export data');
      
      const rows = res.data;
      if (rows.length === 0) {
        toast.info('Aucune donnée à exporter.');
        return;
      }
      const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      exportToCsv({
        filename: `reports_admin_${dateStamp}.csv`,
        rows,
        columns: [
          { key: 'report_id', header: 'ID' },
          { key: 'report_titre', header: 'Titre' },
          { key: 'report_type', header: 'Type' },
          { key: 'report_statut', header: 'Statut' },
          { key: 'report_note', header: 'Note' },
          { key: 'student_nom', header: 'Nom Etudiant' },
          { key: 'student_prenom', header: 'Prenom Etudiant' },
          { key: 'encadrant_nom', header: 'Encadrant' },
          { key: 'date_depot', header: 'Date Depot' },
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
        title="Gestion des rapports"
        description="Vue d'ensemble et recherche dans les rapports académiques."
        actions={
            <Button variant="outline" onClick={handleExportReports} disabled={exportLoading}>
                {exportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Exporter CSV
            </Button>
        }
      />

      {/* 👇 MODULE DE RECHERCHE FULL-TEXT (STYLE HARMONISÉ) 👇 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-600" />
                Recherche Sémantique & Full-Text
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col gap-3">
                <div className="w-full">
                    <GlobalSearch />
                </div>
                <p className="text-xs text-muted-foreground">
                    Ce module interroge directement le <strong>contenu</strong> des fichiers PDF stockés sur le serveur.
                </p>
            </div>
        </CardContent>
      </Card>
      {/* 👆 FIN BLOC RECHERCHE 👆 */}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres & Métadonnées</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          
          {/* RECHERCHE LOCALE */}
          <div className="space-y-2">
            <Label>Recherche rapide (Titre/Nom)</Label>
            <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Ex: Projet Java, Dahibi..." 
            />
          </div>

          {/* STATUT */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Soumis">Soumis</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="Validé">Validé</SelectItem>
                <SelectItem value="Refusé">Refusé</SelectItem>
                <SelectItem value="À corriger">À corriger</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* TYPE */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="PFE">PFE</SelectItem>
                <SelectItem value="PFA">PFA</SelectItem>
                <SelectItem value="Stage">Stage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste globale des rapports ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sujet</TableHead>
                <TableHead>Étudiant</TableHead>
                <TableHead>Encadrant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date Dépôt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Aucun rapport trouvé correspondant aux filtres.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((rapport) => (
                  <TableRow key={rapport.id_rapport}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium truncate max-w-[250px]" title={rapport.titre}>
                            {rapport.titre}
                        </p>
                        {rapport.note && (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                Note : {rapport.note}/20
                            </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{rapport.nom_etudiant} {rapport.prenom_etudiant}</span>
                            <span className="text-xs text-muted-foreground">{rapport.email_etudiant}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                        {rapport.nom_encadrant ? `Pr. ${rapport.nom_encadrant}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rapport.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(rapport.statut)}>
                        {rapport.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(rapport.date_depot), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => navigate(`/admin/report/${rapport.id_rapport}`)}
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
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