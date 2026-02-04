import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Lock, Bell, ShieldCheck, KeyRound, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { navItems } from '@/config/navigation';
import { type RoleType, type Utilisateur } from '@/types';
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

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings } = useAdminPlatformSettings();
  const isAdmin = user?.role === 'ADMIN';
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [resetRole, setResetRole] = useState<'ETUDIANT' | 'ENCADRANT' | ''>('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetMode, setResetMode] = useState<'manual' | 'temporary'>('manual');
  const [manualPassword, setManualPassword] = useState('');
  const [restoreRole, setRestoreRole] = useState<'ETUDIANT' | 'ENCADRANT' | ''>('');
  const [restoreUserId, setRestoreUserId] = useState('');
  const [restoreActive, setRestoreActive] = useState(true);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const res = await api.get('/api/utilisateurs');
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else {
          setUsers([]);
          console.warn('Format de données inattendu:', res.data);
        }
      } catch (error) {
        console.error(error);
        setUsersError('Impossible de charger les utilisateurs.');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [isAdmin]);

  const resetPasswordEndpoint = '/api/admin/reset-password';
  const resetPasswordSupported = false;
  const tempPasswordSupported = false;
  const restoreAccessSupported = true;

  useEffect(() => {
    if (isAdmin && !resetPasswordSupported) {
      console.warn(`Missing backend endpoint: ${resetPasswordEndpoint}`);
    }
  }, [isAdmin, resetPasswordEndpoint, resetPasswordSupported]);

  useEffect(() => {
    const selected = users.find((item) => item.id === restoreUserId);
    if (selected) {
      setRestoreActive(Boolean(selected.actif));
    }
  }, [restoreUserId, users]);

  const roleLabels: Record<RoleType, string> = {
    ADMIN: 'Administrateur',
    ENCADRANT: 'Encadrant',
    ETUDIANT: 'Étudiant',
  };

  const isNavItemVisibleForRole = (role: RoleType, href: string) => {
    if (role === 'ENCADRANT' && href === '/supervisor/history') {
      return settings.roleUi.supervisor.showHistoryPage;
    }
    if (role === 'ETUDIANT' && href === '/student/report/create') {
      return settings.roleUi.student.showNewDepositButton;
    }
    return true;
  };

  const accessByRole = useMemo(() => {
    return (['ADMIN', 'ENCADRANT', 'ETUDIANT'] as RoleType[]).map((role) => ({
      role,
      pages: navItems
        .filter((item) => item.roles?.includes(role))
        .filter((item) => isNavItemVisibleForRole(role, item.href))
        .map((item) => item.title),
    }));
  }, [settings]);

  const resetUsers = useMemo(() => users.filter((u) => u.role === resetRole), [users, resetRole]);
  const restoreUsers = useMemo(() => users.filter((u) => u.role === restoreRole), [users, restoreRole]);

  const formatUserLabel = (userItem: Utilisateur) => {
    const login = (userItem as any).login ? ` (${(userItem as any).login})` : '';
    const status = userItem.actif ? 'actif' : 'inactif';
    return `${userItem.nom ?? ''} ${userItem.prenom ?? ''} — ${userItem.email ?? ''}${login} — ${status}`;
  };

  const resetSubmitDisabled =
    !resetPasswordSupported ||
    !resetRole ||
    !resetUserId ||
    (resetMode === 'manual' && manualPassword.trim().length === 0);

  const restoreSubmitDisabled =
    !restoreAccessSupported || !restoreRole || !restoreUserId || restoreSubmitting;

  const handleRestoreAccess = async () => {
    if (!restoreAccessSupported) return;
    const selected = users.find((item) => item.id === restoreUserId);
    if (!selected) return;

    setRestoreSubmitting(true);
    try {
      await api.patch(`/api/utilisateurs/${selected.id}`, { actif: restoreActive });
      setUsers((prev) =>
        prev.map((item) => (item.id === selected.id ? { ...item, actif: restoreActive } : item))
      );
      toast.success(restoreActive ? 'Compte réactivé.' : 'Compte désactivé.');
      setRestoreConfirmOpen(false);
      setRestoreDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de mettre à jour le statut.');
    } finally {
      setRestoreSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Paramètres" description="Gérez vos préférences" />

      <div className="space-y-6 max-w-4xl">
        {/* Section Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notif">Notifications par email</Label>
              <Switch id="email-notif" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="browser-notif">Notifications navigateur</Label>
              <Switch id="browser-notif" />
            </div>
          </CardContent>
        </Card>

        {/* Section Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground mb-2">
                    Pour modifier votre mot de passe, cliquez sur le bouton ci-dessous.
                </p>
                <Button variant="outline" asChild className="w-fit">
                    {/* Assurez-vous que la route /change-password est définie dans App.tsx */}
                    <Link to="/change-password">Changer le mot de passe</Link>
                </Button>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Droits d’accès
                </CardTitle>
                <CardDescription>Les rôles proviennent de users_login.role.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {accessByRole.map((access) => (
                  <div key={access.role} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{access.role}</Badge>
                      <Badge className="bg-green-600 text-white">Actif</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{roleLabels[access.role]}</p>
                      <p className="text-xs text-muted-foreground">Accès aux pages :</p>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {access.pages.map((page) => (
                        <li key={page}>• {page}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Gestion des mots de passe
                </CardTitle>
                <CardDescription>Réinitialisez ou restaurez l’accès aux comptes.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Réinitialisation</p>
                      <p className="text-xs text-muted-foreground">ETUDIANT · ENCADRANT</p>
                    </div>
                    <Button variant="outline" onClick={() => setResetDialogOpen(true)}>
                      Réinitialiser le mot de passe
                    </Button>
                  </div>
                  {!resetPasswordSupported && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Cette fonctionnalité nécessite un endpoint backend (reset password).
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Restaurer l’accès (Réactiver)</p>
                      <p className="text-xs text-muted-foreground">ETUDIANT · ENCADRANT</p>
                    </div>
                    <Button variant="outline" onClick={() => setRestoreDialogOpen(true)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restaurer l’accès
                    </Button>
                  </div>
                  {!restoreAccessSupported && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Cette fonctionnalité nécessite un endpoint backend (actif).
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>Choisissez un utilisateur et un mode de réinitialisation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={resetRole}
                onValueChange={(value) => {
                  setResetRole(value as 'ETUDIANT' | 'ENCADRANT');
                  setResetUserId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETUDIANT">ETUDIANT</SelectItem>
                  <SelectItem value="ENCADRANT">ENCADRANT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Utilisateur</Label>
              <Select
                value={resetUserId}
                onValueChange={setResetUserId}
                disabled={!resetRole || usersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      usersLoading ? 'Chargement...' : resetRole ? 'Sélectionner un utilisateur' : 'Choisir un rôle'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {usersError && (
                    <SelectItem value="error" disabled>
                      Erreur de chargement
                    </SelectItem>
                  )}
                  {!usersError && resetRole && resetUsers.length === 0 && (
                    <SelectItem value="empty" disabled>
                      {resetRole === 'ENCADRANT' ? 'Aucun encadrant trouvé' : 'Aucun étudiant trouvé'}
                    </SelectItem>
                  )}
                  {resetUsers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {formatUserLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={resetMode} onValueChange={(value) => setResetMode(value as 'manual' | 'temporary')}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Définir un nouveau mot de passe</SelectItem>
                  <SelectItem value="temporary" disabled={!tempPasswordSupported}>
                    Générer un mot de passe temporaire
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {resetMode === 'manual' && (
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={manualPassword}
                  onChange={(event) => setManualPassword(event.target.value)}
                  placeholder="Saisir un mot de passe"
                />
              </div>
            )}
            {!resetPasswordSupported && (
              <p className="text-xs text-muted-foreground">
                ⚠️ Cette fonctionnalité nécessite un endpoint backend (reset password).
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => setResetConfirmOpen(true)} disabled={resetSubmitDisabled}>
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la réinitialisation</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action réinitialise le mot de passe de l’utilisateur sélectionné.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!resetPasswordSupported) return;
                toast.info('Réinitialisation en attente du backend.');
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Restaurer l’accès (Réactiver)</DialogTitle>
            <DialogDescription>Activez ou désactivez l’accès pour un compte.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={restoreRole}
                onValueChange={(value) => {
                  setRestoreRole(value as 'ETUDIANT' | 'ENCADRANT');
                  setRestoreUserId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETUDIANT">ETUDIANT</SelectItem>
                  <SelectItem value="ENCADRANT">ENCADRANT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Utilisateur</Label>
              <Select
                value={restoreUserId}
                onValueChange={setRestoreUserId}
                disabled={!restoreRole || usersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      usersLoading ? 'Chargement...' : restoreRole ? 'Sélectionner un utilisateur' : 'Choisir un rôle'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {usersError && (
                    <SelectItem value="error" disabled>
                      Erreur de chargement
                    </SelectItem>
                  )}
                  {!usersError && restoreRole && restoreUsers.length === 0 && (
                    <SelectItem value="empty" disabled>
                      {restoreRole === 'ENCADRANT' ? 'Aucun encadrant trouvé' : 'Aucun étudiant trouvé'}
                    </SelectItem>
                  )}
                  {restoreUsers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {formatUserLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <Label>Statut du compte</Label>
                <p className="text-xs text-muted-foreground">Activez ou désactivez l’accès.</p>
              </div>
              <Switch checked={restoreActive} onCheckedChange={setRestoreActive} />
            </div>
            {!restoreAccessSupported && (
              <p className="text-xs text-muted-foreground">
                ⚠️ Cette fonctionnalité nécessite un endpoint backend (actif).
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => setRestoreConfirmOpen(true)} disabled={restoreSubmitDisabled}>
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la mise à jour</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmez-vous la modification du statut de ce compte ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreAccess} disabled={restoreSubmitting}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
