import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { History, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import {
  actionLabels,
  fetchAuditLogs,
  formatAuditDate,
  getActionLabel,
  getActorLabel,
  getRoleLabel,
  type AuditLog,
} from '@/lib/audit';

const DEFAULT_PAGE_SIZE = 30;
const ROLE_LABELS: Record<string, string> = {
  ETUDIANT: 'Étudiant',
  ENCADRANT: 'Encadrant',
  ADMIN: 'Admin',
};

export default function SupervisorHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [rapports, setRapports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'mine' | 'students'>('all');
  const [reportFilter, setReportFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(DEFAULT_PAGE_SIZE);

  const reportOptions = useMemo(
    () =>
      rapports
        .filter((rapport) => rapport?.id_rapport)
        .map((rapport) => ({
          id: String(rapport.id_rapport),
          title: rapport.titre || `Rapport #${rapport.id_rapport}`,
        })),
    [rapports],
  );

  const reportMap = useMemo(() => {
    return new Map(
      rapports
        .filter((rapport) => rapport?.id_rapport)
        .map((rapport) => [Number(rapport.id_rapport), rapport]),
    );
  }, [rapports]);

  const supervisedReportIds = useMemo(() => {
    return new Set(rapports.map((rapport) => Number(rapport.id_rapport)).filter(Boolean));
  }, [rapports]);

  const supervisedStudentIds = useMemo(() => {
    const studentIds = rapports
      .map((rapport) => rapport?.id_etudiant ?? rapport?.id_user ?? rapport?.id_etudiant_fk)
      .filter(Boolean)
      .map((id) => Number(id));
    return new Set(studentIds);
  }, [rapports]);

  const getReportIdFromEntry = (entry: AuditLog) => {
    const rawId =
      (entry as any).id_rapport ??
      (entry as any).reportId ??
      (entry as any).id_report ??
      (entry as any).related_id ??
      (entry as any).id_entite;

    if (typeof rawId === 'number') return rawId;
    if (typeof rawId === 'string' && rawId.trim() !== '') {
      const parsed = Number(rawId);
      if (!Number.isNaN(parsed)) return parsed;
    }

    const details = String(entry.details ?? '');
    const match = details.match(/rapport[^0-9]*(\d+)/i) || details.match(/id_rapport[^0-9]*(\d+)/i);
    if (match) {
      const parsed = Number(match[1]);
      if (!Number.isNaN(parsed)) return parsed;
    }

    return null;
  };

  const getRoleBadge = (entry: AuditLog) => {
    const role = entry.role?.toUpperCase() ?? '';
    return ROLE_LABELS[role] || getRoleLabel(entry);
  };

  // 1. CHARGEMENT DES DONNEES
  useEffect(() => {
    const fetchHistory = async () => {
      const userId = (user as any)?.id_user;
      const encadrantId = (user as any)?.id_specifique || (user as any)?.id_encadrant;
      
      if (userId && encadrantId) {
        try {
          const [auditLogs, reports] = await Promise.all([
            fetchAuditLogs(),
            api.get(`/api/encadrant/rapports?id_encadrant=${encadrantId}`),
          ]);

          setHistory(Array.isArray(auditLogs) ? auditLogs : []);
          setRapports(Array.isArray(reports.data) ? reports.data : []);
        } catch (error) {
          console.error("Erreur chargement historique", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  // 2. FILTRAGE LOCAL
  const scopedHistory = useMemo(() => {
    if (!user) return [];
    const userId = (user as any)?.id_user;

    return history.filter((entry) => {
      const role = entry.role?.toUpperCase();
      const reportId = getReportIdFromEntry(entry);
      const isEncadrantAction = entry.id_user === userId || role === 'ENCADRANT';
      const isStudentAction = role === 'ETUDIANT' || supervisedStudentIds.has(entry.id_user);

      if (!isEncadrantAction && !isStudentAction) return false;
      if (isEncadrantAction && entry.id_user !== userId) return false;

      if (isEncadrantAction) {
        return true;
      }

      if (reportId && supervisedReportIds.has(reportId)) return true;
      if (supervisedStudentIds.has(entry.id_user)) return true;

      return false;
    });
  }, [history, supervisedReportIds, supervisedStudentIds, user]);

  const filteredHistory = useMemo(() => {
    const searchLower = search.toLowerCase();
    return scopedHistory.filter((entry) => {
      const reportId = getReportIdFromEntry(entry);
      const reportTitle = reportId ? reportMap.get(reportId)?.titre ?? `Rapport #${reportId}` : '';
      const role = entry.role?.toUpperCase();

      const matchesSearch =
        (entry.details || '').toLowerCase().includes(searchLower) ||
        (entry.type_action || '').toLowerCase().includes(searchLower) ||
        (getActionLabel(entry) || '').toLowerCase().includes(searchLower) ||
        (getActorLabel(entry) || '').toLowerCase().includes(searchLower) ||
        reportTitle.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      const matchesReport = reportFilter === 'all' || reportId === Number(reportFilter);
      if (!matchesReport) return false;

      if (viewFilter === 'mine') {
        return entry.id_user === (user as any)?.id_user;
      }

      if (viewFilter === 'students') {
        return role === 'ETUDIANT' || supervisedStudentIds.has(entry.id_user);
      }

      return true;
    });
  }, [scopedHistory, search, reportFilter, reportMap, supervisedStudentIds, user, viewFilter]);

  const sortedHistory = useMemo(() => {
    return filteredHistory
      .slice()
      .sort((a, b) => new Date(b.date_action).getTime() - new Date(a.date_action).getTime());
  }, [filteredHistory]);

  const visibleHistory = useMemo(() => {
    return sortedHistory.slice(0, visibleCount);
  }, [sortedHistory, visibleCount]);

  useEffect(() => {
    setVisibleCount(DEFAULT_PAGE_SIZE);
  }, [search, reportFilter, viewFilter]);

  if (!user) return null;
  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary"/></div>;

  const showNoStudentActivity = viewFilter === 'students' && filteredHistory.length === 0;

  return (
    <AppLayout>
      <PageHeader
        title="Historique encadrant"
        description="Suivi de vos actions sur les rapports"
      />

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 relative md:col-span-2">
              <Label>Recherche</Label>
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                      placeholder="Rechercher dans l'historique..." 
                      className="pl-10"
                  />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Par rapport</Label>
              <Select value={reportFilter} onValueChange={setReportFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les rapports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rapports</SelectItem>
                  {reportOptions.map((rapport) => (
                    <SelectItem key={rapport.id} value={rapport.id}>
                      {rapport.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={viewFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('all')}
            >
              Tout
            </Button>
            <Button
              variant={viewFilter === 'mine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('mine')}
            >
              Mes actions
            </Button>
            <Button
              variant={viewFilter === 'students' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewFilter('students')}
            >
              Actions étudiants
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Actions récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acteur</TableHead>
                <TableHead>Type d'action</TableHead>
                <TableHead>Rapport</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {showNoStudentActivity
                      ? 'Aucune activité étudiant liée à vos rapports.'
                      : 'Aucune activité pour le moment.'}
                  </TableCell>
                </TableRow>
              ) : (
                visibleHistory.map((entry) => {
                  const reportId = getReportIdFromEntry(entry);
                  const report = reportId ? reportMap.get(reportId) : null;
                  const reportTitle = report?.titre || (reportId ? `Rapport #${reportId}` : '—');
                  return (
                  <TableRow key={entry.id_action}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {getRoleBadge(entry)}
                        </Badge>
                        <span className="text-sm font-medium">{getActorLabel(entry)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                            {actionLabels[entry.type_action] || getActionLabel(entry)}
                        </span>
                    </TableCell>
                    <TableCell className="text-sm">{reportTitle}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.details || '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                        {formatAuditDate(entry.date_action)}
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
          {sortedHistory.length > visibleCount && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setVisibleCount((prev) => prev + DEFAULT_PAGE_SIZE)}>
                Charger plus
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
