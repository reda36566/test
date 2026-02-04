import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Mail, AlertTriangle, MessageSquare, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

// Mapping des icônes selon le type (texte stocké en BDD)
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  NEW_VERSION: FileText,
  NEW_COMMENT: MessageSquare,
  STATUS_CHANGE: Bell,
  GRADE_PUBLISHED: Check,
  PLAGIARISM_ALERT: AlertTriangle,
  SYSTEM: Mail,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Charger les notifications
  const fetchNotifications = async () => {
    if (user?.id_user) {
      try {
        // ✅ CORRECTION : Ajout de /api
        const res = await api.get(`/api/notifications?id_user=${user.id_user}`);
        setNotifications(res.data);
      } catch (error) {
        console.error("Erreur chargement notifications", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // 2. Marquer comme lu
  const handleMarkAsRead = async (id: number, lien?: string) => {
    try {
      // On met à jour visuellement tout de suite (Optimistic UI)
      setNotifications(prev => prev.map(n => 
        n.id_notification === id ? { ...n, lue: 1 } : n
      ));
      
      // ✅ CORRECTION : Ajout de /api
      // Appel API en arrière-plan
      await api.put(`/api/notifications/${id}/read`);

      // Si y a un lien, on redirige
      if (lien) navigate(lien);
      
    } catch (error) {
      console.error("Erreur update notification", error);
    }
  };

  // 3. Tout marquer comme lu
  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, lue: 1 })));
      // ✅ CORRECTION : Ajout de /api (Attention: il faut que cette route existe dans server.js)
      // Si elle n'existe pas encore, cela retournera une 404 mais ne plantera pas l'app
      await api.put(`/api/notifications/read-all`, { id_user: user?.id_user });
    } catch (error) {
      console.error("Erreur tout marquer lu", error);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

  const unreadCount = notifications.filter(n => !n.lue).length;

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : "Aucune nouvelle notification"}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <Check className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-0 divide-y">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Vous êtes à jour ! Aucune notification.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = iconMap[notif.type] || Bell;
              const isUnread = !notif.lue;

              return (
                <div
                  key={notif.id_notification}
                  className={cn(
                    'flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                    isUnread && 'bg-blue-50/50'
                  )}
                  onClick={() => handleMarkAsRead(notif.id_notification, notif.lien)}
                >
                  <div className={cn(
                    'rounded-full p-2 shrink-0',
                    notif.type === 'PLAGIARISM_ALERT' ? 'bg-red-100 text-red-600' : 
                    isUnread ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-medium", isUnread ? "text-foreground" : "text-muted-foreground")}>
                        {notif.titre}
                      </p>
                      {isUnread && <Badge variant="default" className="text-[10px] h-5">Nouveau</Badge>}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notif.message}
                    </p>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(notif.date_creation), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}