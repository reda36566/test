import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell,
  Menu,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Search,
  Activity,
  Loader2,
  Plus,
  UserPlus,
  Download,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import api from '@/lib/api';
import { exportToCsv } from '@/lib/csv';
import {
  fetchAuditLogs,
  formatAuditDate,
  getActionLabel,
  getActorLabel,
  getRoleLabel,
  type AuditLog,
} from '@/lib/audit';
import { useAdminPlatformSettings, maskEmailValue } from '@/contexts/AdminPlatformSettingsContext';
import { useAvatar } from '@/contexts/AvatarContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAdminPlatformSettings();
  const { avatarUrl, avatarType, handleAvatarError } = useAvatar();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [hasNewActivity, setHasNewActivity] = useState(false);
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

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const showActivityIcon = isAdmin && settings.roleUi.admin.showActivityIcon;
  const shouldShowNotifications = user.role === 'ETUDIANT' || user.role === 'ENCADRANT';
  const isSupervisor = user.role === 'ENCADRANT';
  const unreadCount = notifications.filter((notification) => !notification.lue).length;
  const notificationLimit = settings.notifications.dropdownCount || 8;
  const notificationItems = useMemo(() => {
    const sorted = notifications
      .slice()
      .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
    if (!settings.notifications.groupSimilar) {
      return sorted;
    }
    const seen = new Set<string>();
    return sorted.filter((notification) => {
      const key = `${notification.titre}-${notification.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [notifications, settings.notifications.groupSimilar]);

  const initials = `${user.utilisateur?.prenom?.[0] ?? ''}${user.utilisateur?.nom?.[0] ?? ''}`.toUpperCase();
  const displayEmail = settings.security.maskEmail
    ? maskEmailValue(user.utilisateur?.email ?? '')
    : user.utilisateur?.email ?? '';

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case 'ADMIN':
        return 'bg-destructive text-destructive-foreground';
      case 'ENCADRANT':
        return 'bg-primary text-primary-foreground';
      case 'ETUDIANT':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = () => {
    switch (user.role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'ENCADRANT':
        return 'Encadrant';
      case 'ETUDIANT':
        return 'Étudiant';
      default:
        return user.role;
    }
  };

  const getNotificationsLink = () => {
    switch (user.role) {
      case 'ADMIN':
        return '/admin/notifications';
      case 'ENCADRANT':
        return '/supervisor/notifications';
      case 'ETUDIANT':
        return '/student/notifications';
      default:
        return '/notifications';
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id_user || !shouldShowNotifications) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const res = await api.get(`/api/notifications?id_user=${user.id_user}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
    } catch (error) {
      console.error('Erreur chargement notifications', error);
      setNotificationsError('Impossible de charger les notifications.');
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id_user, user?.role]);

  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  const activityItems = useMemo(() => activityLogs.slice(0, 10), [activityLogs]);

  const fetchActivityLogs = async (updateLastSeen = false) => {
    if (!showActivityIcon) return;
    setActivityLoading(true);
    setActivityError(null);
    try {
      const data = await fetchAuditLogs();
      const sorted = data
        .slice()
        .sort((a, b) => new Date(b.date_action).getTime() - new Date(a.date_action).getTime());
      setActivityLogs(sorted);
      const newest = sorted[0]?.date_action;
      const lastSeen = localStorage.getItem('admin_last_seen_activity_at');
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
      if (newest) {
        const newestTime = new Date(newest).getTime();
        setHasNewActivity(newestTime > lastSeenTime);
        if (updateLastSeen) {
          localStorage.setItem('admin_last_seen_activity_at', newest);
          setHasNewActivity(false);
        }
      } else {
        setHasNewActivity(false);
      }
    } catch (error) {
      console.error('Erreur chargement activité', error);
      setActivityError("Impossible de charger l'activité.");
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (showActivityIcon) {
      fetchActivityLogs();
    }
  }, [showActivityIcon]);

  useEffect(() => {
    if (activityOpen && showActivityIcon) {
      fetchActivityLogs(true);
    }
  }, [activityOpen, showActivityIcon]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    toast.info('Recherche globale bientôt disponible');
    setMobileSearchOpen(false);
  };

  const handleNotificationClick = async (notification: any) => {
    const notificationId = notification.id_notification ?? notification.id;
    if (notificationId) {
      setNotifications((prev) =>
        prev.map((item) =>
          (item.id_notification ?? item.id) === notificationId ? { ...item, lue: true } : item
        )
      );
      try {
        await api.put(`/api/notifications/${notificationId}/read`);
      } catch (error) {
        console.error('Erreur update notification', error);
      }
    }
    if (notification.lien) {
      navigate(notification.lien);
      return;
    }
    navigate(getNotificationsLink());
  };

  const handleExportSupervisorCsv = async () => {
    if (!isSupervisor) return;
    setExportLoading(true);
    try {
      const res = await api.get('/api/encadrant/export/my-students', {
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
        filename: `encadrant_students_reports_${dateStamp}.csv`,
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="flex flex-1 items-center gap-4">
        

        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-full border-muted pl-9"
              aria-label="Recherche globale"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Popover open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
              <span className="sr-only">Ouvrir la recherche</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3">
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Recherche</label>
              <Input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setMobileSearchOpen(false);
                  }
                }}
                placeholder="Rechercher…"
                className="w-full rounded-full border-muted"
              />
              <p className="text-[11px] text-muted-foreground">
                Appuyez sur Entrée pour lancer la recherche.
              </p>
            </form>
          </PopoverContent>
        </Popover>

        {shouldShowNotifications && (
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-muted-foreground">{unreadCount} non lue(s)</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsLoading && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Chargement...
                  </div>
                )}
                {!notificationsLoading && notificationsError && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    <p>{notificationsError}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={fetchNotifications}>
                      Réessayer
                    </Button>
                  </div>
                )}
                {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Aucune notification pour le moment.
                  </div>
                )}
                {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                  <>
                    {notificationItems
                      .slice(0, notificationLimit)
                      .map((notification) => (
                        <button
                          key={notification.id_notification ?? notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50',
                            !notification.lue && 'bg-primary/5 font-medium'
                          )}
                        >
                          <span
                            className={cn(
                              'mt-1 h-2 w-2 rounded-full',
                              notification.lue ? 'bg-muted-foreground/40' : 'bg-primary'
                            )}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">
                                {notification.titre || 'Notification'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.date_creation), 'dd MMM yyyy à HH:mm', { locale: fr })}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                        </button>
                      ))}
                  </>
                )}
              </div>
              <div className="border-t p-2">
                <Button variant="ghost" className="w-full" asChild>
                  <Link to={getNotificationsLink()}>Voir tout</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showActivityIcon && (
          <Popover open={activityOpen} onOpenChange={setActivityOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Activity className="h-5 w-5" />
                {hasNewActivity && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive" />
                )}
                <span className="sr-only">Activité récente</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[420px] p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">Activité récente</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {activityLoading && (
                  <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement...
                  </div>
                )}
                {!activityLoading && activityError && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    <p>{activityError}</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchActivityLogs(true)}>
                      Réessayer
                    </Button>
                  </div>
                )}
                {!activityLoading && !activityError && activityItems.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Aucune activité récente.
                  </div>
                )}
                {!activityLoading && !activityError && activityItems.length > 0 && (
                  activityItems.map((entry) => (
                    <div key={entry.id_action} className="flex items-start gap-3 px-4 py-3 text-sm">
                      <Badge variant="secondary" className="mt-0.5 text-[10px]">
                        {getActionLabel(entry)}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{getActorLabel(entry)}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatAuditDate(entry.date_action)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getRoleLabel(entry).toUpperCase()} · {entry.details || 'Action enregistrée'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t p-2">
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/admin/audit">Voir le journal d'audit</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {isSupervisor && (
          <Button variant="outline" size="sm" onClick={handleExportSupervisorCsv} disabled={exportLoading}>
            {exportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exporter .CSV
          </Button>
        )}

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ajouts rapides</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/users/create" className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Ajouter un utilisateur
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/academic" className="flex items-center">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Ajouter un département
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/academic" className="flex items-center">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Ajouter une filière
                </Link>
              </DropdownMenuItem>
  
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                {avatarUrl && !isAdmin && (
                  <AvatarImage src={avatarUrl} alt="Avatar utilisateur" onError={handleAvatarError} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-sm font-medium">
                  {user.utilisateur.prenom} {user.utilisateur.nom}
                </span>
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getRoleBadgeColor())}>
                  {getRoleLabel()}
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.utilisateur.prenom} {user.utilisateur.nom}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/${user.role === 'ADMIN' ? 'admin' : user.role === 'ENCADRANT' ? 'supervisor' : 'student'}/profile`} className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Mon Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
