import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Bell, Send, Loader2 } from 'lucide-react';
import api from '@/lib/api';

// --- Types locaux pour éviter les erreurs d'import ---
interface SentNotification {
  id: number;
  titre: string;
  message: string;
  audience: string;
  type: string;
  date: string;
}

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Formulaire
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'encadrants' | 'etudiants' | 'custom'>('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [type, setType] = useState('SYSTEM');
  
  // Données
  const [users, setUsers] = useState<any[]>([]);
  const [history, setHistory] = useState<SentNotification[]>([]);

  // 1. CHARGEMENT DES UTILISATEURS (API)
  useEffect(() => {
    const fetchUsers = async () => {
        setLoading(true);
        try {
            // On récupère la liste réelle des utilisateurs depuis le serveur
            const res = await api.get('http://localhost:3000/api/admin/users');
            if(Array.isArray(res.data)) {
                setUsers(res.data);
            } else {
                setUsers([]); // Sécurité anti-crash
            }
        } catch (error) {
            console.error(error);
            toast.error("Erreur chargement utilisateurs");
        } finally {
            setLoading(false);
        }
    };
    fetchUsers();
  }, []);

  // Filtrage sécurisé
  const encadrants = useMemo(() => users.filter(u => u.role === 'ENCADRANT'), [users]);
  const etudiants = useMemo(() => users.filter(u => u.role === 'ETUDIANT'), [users]);
  // Fusion pour la liste de recherche
  const allTargets = useMemo(() => [...encadrants, ...etudiants], [encadrants, etudiants]);

  const handleSend = async () => {
    if (!title || !message) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }

    if (audience === 'custom' && !selectedUser) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    setSending(true);
    try {
        // 2. ENVOI AU SERVEUR
        await api.post('http://localhost:3000/api/admin/notifications/send', {
            title,
            message,
            type,
            audience,
            target_id: audience === 'custom' ? selectedUser : null
        });

        // Mise à jour de l'historique local (visuel)
        setHistory((prev) => [
            {
              id: Date.now(),
              titre: title,
              message,
              audience: audience === 'custom' 
                ? `Utilisateur ID ${selectedUser}` 
                : (audience === 'all' ? 'Tous' : audience),
              type,
              date: new Date().toISOString(),
            },
            ...prev,
        ]);

        toast.success('Notification envoyée avec succès !');
        setTitle('');
        setMessage('');
        setSelectedUser('');
    } catch (error) {
        console.error(error);
        toast.error("Erreur lors de l'envoi");
    } finally {
        setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <AppLayout>
      <PageHeader
        title="Notifications administrateur"
        description="Envoyer des notifications globales ou ciblées"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FORMULAIRE D'ENVOI */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Nouvelle notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={(value: any) => setAudience(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    <SelectItem value="encadrants">Encadrants seulement</SelectItem>
                    <SelectItem value="etudiants">Étudiants seulement</SelectItem>
                    <SelectItem value="custom">Utilisateur spécifique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM">Système (Info)</SelectItem>
                    <SelectItem value="WARNING">Avertissement</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {audience === 'custom' && (
              <div className="space-y-2">
                <Label>Destinataire</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rechercher un utilisateur..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {allTargets.map((u) => (
                      <SelectItem key={u.id_user} value={String(u.id_user)}>
                        {u.nom} {u.prenom} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la notification" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Votre message..." />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full sm:w-auto">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Envoyer la notification
            </Button>
          </CardContent>
        </Card>

        {/* HISTORIQUE SESSION */}
        <Card>
          <CardHeader>
            <CardTitle>Historique (Session)</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p>Aucun envoi récent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3 bg-muted/50">
                    <p className="font-medium text-sm">{item.titre}</p>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground capitalize">{item.audience}</p>
                        <Badge variant="outline" className="text-[10px] h-5">{item.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                      {new Date(item.date).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}