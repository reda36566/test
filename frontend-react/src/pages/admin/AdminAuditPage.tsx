import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge'; // Ajout pour le style
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { FileDown, History, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import {
  actionLabels,
  fetchAuditLogs,
  formatAuditDate,
  getActionLabel,
  getActorLabel,
  getRoleLabel,
  type AuditLog,
} from '@/lib/audit';

export default function AdminAuditPage() {
  const { settings } = useAdminPlatformSettings();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<AuditLog[]>([]);
  
  // Filtres
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // 1. CHARGEMENT DES LOGS
  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Utilisation du chemin relatif configuré dans votre api.ts
      const data = await fetchAuditLogs();
      setActions(data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger l'historique");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 2. FILTRAGE LOCAL
  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      const matchesUser = selectedUser === 'all' || String(action.id_user) === selectedUser;
      const matchesAction = selectedAction === 'all' || action.type_action === selectedAction;
      const matchesRole = selectedRole === 'all' || action.role === selectedRole;
      
      const actionDate = new Date(action.date_action).getTime();
      if (isNaN(actionDate)) return false; // Sécurité anti-données corrompues

      const matchesFrom = dateFrom ? actionDate >= new Date(dateFrom).getTime() : true;
      // On inclut jusqu'à la fin de la journée sélectionnée (23:59:59)
      const matchesTo = dateTo ? actionDate <= new Date(dateTo).setHours(23,59,59,999) : true;

      return matchesUser && matchesAction && matchesRole && matchesFrom && matchesTo;
    });
  }, [actions, selectedUser, selectedAction, selectedRole, dateFrom, dateTo]);

  // Listes pour les filtres
  const uniqueUsers = useMemo(() => {
    const usersMap = new Map();
    actions.forEach(a => {
        if(a.login && !usersMap.has(a.id_user)) {
            usersMap.set(a.id_user, a.login);
        }
    });
    return Array.from(usersMap.entries());
  }, [actions]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(actions.map(a => a.type_action)));
  }, [actions]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <AppLayout>
      <PageHeader
        title="Journal d'audit"
        description="Historique complet des actions sur la plateforme"
      >
        {settings.roleUi.admin.showExportButtons && (
          <Button variant="outline" onClick={() => toast.success('Export CSV généré')}>
            <FileDown className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </PageHeader>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filtres de recherche</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Utilisateur</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                {uniqueUsers.map(([id, login]) => (
                  <SelectItem key={id} value={String(id)}>{login}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Type d'action</Label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>{actionLabels[type] || type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="ETUDIANT">Étudiants</SelectItem>
                <SelectItem value="ENCADRANT">Encadrants</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Depuis le</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Jusqu'au</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Date & Heure</TableHead>
                <TableHead className="text-right pr-6">Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Aucune activité trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActions.map((entry) => (
                  <TableRow key={entry.id_action}>
                    <TableCell className="pl-6">
                        <div className="font-medium">{getActorLabel(entry)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{getRoleLabel(entry)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {getRoleLabel(entry)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="font-semibold text-[10px]">
                            {getActionLabel(entry)}
                        </Badge>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm" title={entry.details}>
                        {entry.details}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {formatAuditDate(entry.date_action)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button size="icon" variant="ghost" onClick={() => setSelectedLog(entry)}>
                        <History className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE DETAIL */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Action #{selectedLog?.id_action}
            </DialogTitle>
            <DialogDescription>Détails techniques de l'événement d'audit.</DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border">
                    <div>
                        <Label className="text-xs text-muted-foreground">Utilisateur</Label>
                        <p className="font-semibold">{getActorLabel(selectedLog)}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Rôle</Label>
                        <p className="font-semibold">{getRoleLabel(selectedLog)}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <p className="font-semibold">{format(new Date(selectedLog.date_action), 'PPP à HH:mm', { locale: fr })}</p>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <p className="font-semibold">{selectedLog.type_action}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Message détaillé</Label>
                    <div className="p-3 bg-white border rounded-md font-mono text-[13px] break-words">
                        {selectedLog.details}
                    </div>
                </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
