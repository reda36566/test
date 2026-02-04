import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  Trash2,
  UserCheck,
  UserX,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Utilisateur, RoleType } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import api from '@/lib/api';
import { exportToCsv } from '@/lib/csv';

const ITEMS_PER_PAGE = 10;

// ✅ FONCTION DE SÉCURITÉ POUR LA DATE
// Empêche le crash si la date est invalide ou null
const safeDate = (dateString: any) => {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        // Vérifie si la date est valide
        if (isNaN(d.getTime())) return '-'; 
        return format(d, 'dd MMM yyyy HH:mm', { locale: fr });
    } catch (e) {
        return 'Erreur date';
    }
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { settings } = useAdminPlatformSettings();
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Pour afficher l'erreur si besoin

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Utilisateur | null>(null);
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

  // 1. CHARGEMENT
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // On utilise bien /api/utilisateurs comme configuré dans le serveur
      const res = await api.get('/api/utilisateurs');
      if (Array.isArray(res.data)) {
          setUsers(res.data);
      } else {
          setUsers([]);
          console.warn("Format de données inattendu:", res.data);
      }
    } catch (error: any) {
      console.error("Erreur API:", error);
      setError("Impossible de charger les utilisateurs. Vérifiez que le serveur tourne.");
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrage sécurisé
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return []; // Sécurité
    
    return users.filter((user) => {
      if (!user) return false; // Sécurité anti-crash

      const searchLower = searchQuery.toLowerCase();
      // On sécurise chaque champ avec || ''
      const nom = user.nom || '';
      const prenom = user.prenom || '';
      const email = user.email || '';
      const login = (user as any).login || ''; 

      const matchesSearch =
        nom.toLowerCase().includes(searchLower) ||
        prenom.toLowerCase().includes(searchLower) ||
        email.toLowerCase().includes(searchLower) ||
        login.toLowerCase().includes(searchLower);

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.actif) ||
        (statusFilter === 'inactive' && !user.actif);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteClick = (user: Utilisateur) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await api.delete(`/api/utilisateurs/${userToDelete.id}`);
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        toast.success(`Utilisateur supprimé`);
      } catch (error) {
        console.error(error);
        toast.error("Erreur suppression");
      } finally {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    }
  };

  const handleToggleStatus = async (user: Utilisateur) => {
    const nouveauStatut = !user.actif;
    // Optimistic update
    setUsers(users.map((u) => u.id === user.id ? { ...u, actif: nouveauStatut } : u));

    try {
      await api.patch(`/api/utilisateurs/${user.id}`, { actif: nouveauStatut });
      toast.success(nouveauStatut ? `Activé` : `Désactivé`);
    } catch (error) {
      toast.error("Erreur modification");
      setUsers(users.map((u) => u.id === user.id ? { ...u, actif: !nouveauStatut } : u));
    }
  };

  const getRoleBadgeVariant = (role: RoleType) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'ENCADRANT': return 'default';
      case 'ETUDIANT': return 'secondary';
      default: return 'outline';
    }
  };

  const handleExportUsers = async () => {
    setExportLoading(true);
    try {
      const res = await api.get('/api/admin/export/users', {
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
        filename: `users_${dateStamp}.csv`,
        rows,
        columns: [
          { key: 'user_id', header: 'user_id' },
          { key: 'login', header: 'login' },
          { key: 'role', header: 'role' },
          { key: 'actif', header: 'actif' },
          { key: 'nom', header: 'nom' },
          { key: 'prenom', header: 'prenom' },
          { key: 'email', header: 'email' },
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

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (error) return (
      <AppLayout>
          <div className="p-10 text-center bg-red-50 text-red-600 rounded border border-red-200">
              <AlertTriangle className="h-10 w-10 mx-auto mb-2"/>
              <h3 className="font-bold">Erreur</h3>
              <p>{error}</p>
              <Button onClick={fetchUsers} variant="outline" className="mt-4 border-red-200 hover:bg-red-100">Réessayer</Button>
          </div>
      </AppLayout>
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestion des Utilisateurs"
          description="Gérez les comptes utilisateurs de la plateforme"
        >
          {settings.roleUi.admin.showExportButtons && (
            <Button variant="outline" onClick={handleExportUsers} disabled={exportLoading}>
              {exportLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exporter Utilisateurs .CSV
            </Button>
          )}
          <Button onClick={() => navigate('/admin/users/create')}>
            <Plus className="mr-2 h-4 w-4" /> Nouvel Utilisateur
          </Button>
        </PageHeader>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Rôle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="ENCADRANT">Encadrant</SelectItem>
                <SelectItem value="ETUDIANT">Étudiant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredUsers.length} utilisateur(s)
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold uppercase shrink-0">
                          {(user as any).login?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">
                             {/* ✅ AFFICHAGE SÉCURISÉ DU NOM */}
                             {(user.prenom || user.nom) ? `${user.prenom || ''} ${user.nom || ''}` : ((user as any).login || 'Utilisateur')}
                          </div>
                          <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{(user as any).login || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.actif ? 'default' : 'secondary'} className={user.actif ? "bg-green-600" : ""}>
                        {user.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* ✅ UTILISATION DE LA FONCTION SÉCURISÉE safeDate */}
                      {safeDate(user.derniere_connexion)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.actif ? <><UserX className="mr-2 h-4 w-4" /> Désactiver</> : <><UserCheck className="mr-2 h-4 w-4" /> Activer</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Page {currentPage} sur {totalPages}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer suppression</AlertDialogTitle>
            <AlertDialogDescription>
                Voulez-vous vraiment supprimer cet utilisateur ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
