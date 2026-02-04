import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, SearchEmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
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
import { Plus, Search, Eye, Clock, X, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '@/lib/api';
// 👇 IMPORT DU MODULE DE RECHERCHE
import GlobalSearch from "@/components/GlobalSearch";

// --- FONCTIONS LOCALES ---

const getStatusBadge = (status: string) => {
  const s = (status || '').trim();
  let colorClass = "bg-gray-100 text-gray-800"; 

  if (s === 'Validé') colorClass = "bg-green-100 text-green-800";
  else if (s === 'À corriger') colorClass = "bg-yellow-100 text-yellow-800";
  else if (s === 'Soumis') colorClass = "bg-blue-100 text-blue-800";

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${colorClass}`}>
      {s || 'Inconnu'}
    </span>
  );
};

const getTypeBadge = (type: string) => {
  const t = (type || '').toLowerCase();
  let colorClass = "bg-gray-100 text-gray-800"; 

  if (t.includes('pfe')) colorClass = "bg-purple-100 text-purple-800";
  else if (t.includes('pfa')) colorClass = "bg-indigo-100 text-indigo-800";
  else if (t.includes('stage')) colorClass = "bg-orange-100 text-orange-800";

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
      {type || 'Autre'}
    </span>
  );
};

// -----------------------------------------------------------------------

export default function StudentReportsPage() {
  const { user } = useAuth();
  const { settings } = useAdminPlatformSettings();
  const [rapports, setRapports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 1. CHARGEMENT
  useEffect(() => {
    const fetchRapports = async () => {
      const userId = (user as any)?.id_specifique || (user as any)?.id_etudiant;
      
      if (userId) {
        try {
          const res = await api.get(`/api/etudiant/rapports?id_etudiant=${userId}`);
          setRapports(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
          console.error("Erreur chargement rapports", error);
          setRapports([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchRapports();
  }, [user]);

  // 2. FILTRAGE
  const filteredReports = useMemo(() => {
    return rapports.filter(rapport => {
      if (!rapport) return false;

      const matchesSearch = search === '' || 
        (rapport.titre && rapport.titre.toLowerCase().includes(search.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || rapport.type_libelle === typeFilter;
      const matchesStatus = statusFilter === 'all' || String(rapport.id_statut) === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rapports, search, typeFilter, statusFilter]);

  const hasFilters = search !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const safeDate = (dateString: string) => {
    try {
      if (!dateString) return '-';
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (e) { return '-'; }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <AppLayout>
      <PageHeader
        title="Mes rapports"
        description="Consultez l'historique et le statut de vos dépôts."
        actions={
          settings.roleUi.student.showNewDepositButton && (
            <Button asChild>
              <Link to="/student/report/create">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau rapport
              </Link>
            </Button>
          )
        }
      />

      {/* 👇 MODULE DE RECHERCHE FULL-TEXT (STYLE HARMONISÉ) 👇 */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-600" />
            Recherche intelligente (Full-Text)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <GlobalSearch />
            </div>
            <p className="text-xs text-muted-foreground">
              Recherchez des concepts ou mots-clés directement à l'intérieur de vos fichiers PDF déposés.
            </p>
          </div>
        </CardContent>
      </Card>
      {/* 👆 FIN MODULE RECHERCHE 👆 */}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtre Recherche locale (Titre uniquement) */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrer par titre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtre Type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem> 
                <SelectItem value="Projet de Fin d'Études">Projet de Fin d'Études (PFE)</SelectItem>
                <SelectItem value="Stage Technique">Stage Technique</SelectItem> 
                <SelectItem value="Projet de Fin d'Année">Projet de Fin d'Année</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre Statut */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="2">Soumis</SelectItem>
                <SelectItem value="3">Validé</SelectItem>
                <SelectItem value="4">À corriger</SelectItem> 
              </SelectContent>
            </Select>

            {/* Bouton Reset */}
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredReports.length === 0 ? (
            <div className="p-8">
              {hasFilters ? <SearchEmptyState searchTerm={search} /> : (
                <EmptyState
                  title="Aucun rapport"
                  description="Commencez par déposer votre premier rapport."
                  action={
                    settings.roleUi.student.showNewDepositButton ? (
                      <Button asChild>
                        <Link to="/student/report/create"><Plus className="mr-2 h-4 w-4" /> Créer</Link>
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  {settings.roleUi.student.tableColumns.entreprise && <TableHead>Entreprise</TableHead>}
                  {settings.roleUi.student.tableColumns.module && <TableHead>Module</TableHead>}
                  {settings.roleUi.student.tableColumns.encadrant && <TableHead>Encadrant</TableHead>}
                  <TableHead>Statut</TableHead>
                  {settings.roleUi.student.tableColumns.dateDepot && <TableHead>Date Dépôt</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((rapport) => (
                  <TableRow key={rapport.id_rapport} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium max-w-[200px] truncate" title={rapport.titre}>
                        {rapport.titre || 'Sans titre'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(rapport.type_libelle)}
                    </TableCell>
                    {settings.roleUi.student.tableColumns.entreprise && (
                      <TableCell className="text-muted-foreground">
                        {rapport.nom_entreprise || rapport.entreprise || '-'}
                      </TableCell>
                    )}
                    {settings.roleUi.student.tableColumns.module && (
                      <TableCell className="text-muted-foreground">
                        {rapport.nom_module || rapport.module || '-'}
                      </TableCell>
                    )}
                    {settings.roleUi.student.tableColumns.encadrant && (
                      <TableCell className="text-muted-foreground">
                        {rapport.nom_encadrant 
                          ? `Prof. ${rapport.nom_encadrant}`
                          : 'Non assigné'
                        }
                      </TableCell>
                    )}
                    <TableCell>
                      {getStatusBadge(rapport.statut_libelle)}
                    </TableCell>
                    {settings.roleUi.student.tableColumns.dateDepot && (
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {safeDate(rapport.date_depot)}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/student/report/${rapport.id_rapport}`}>
                          <Eye className="h-4 w-4 mr-1" /> Voir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}