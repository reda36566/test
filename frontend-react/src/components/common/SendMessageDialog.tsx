import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { RoleType } from '@/types';

interface RecipientOption {
  id: string;
  label: string;
  role: RoleType;
  email?: string;
}

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const buildRecipientLabel = (recipient: RecipientOption) =>
  recipient.email ? `${recipient.label} · ${recipient.email}` : recipient.label;

export function SendMessageDialog({ open, onOpenChange }: SendMessageDialogProps) {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);

  const role = user?.role;
  const canSend = role === 'ADMIN' || role === 'ENCADRANT';

  useEffect(() => {
    if (!open || !canSend || !user) return;
    const fetchRecipients = async () => {
      setRecipientsLoading(true);
      setRecipientsError(null);
      try {
        if (role === 'ADMIN') {
          const res = await api.get('/api/utilisateurs');
          const data = Array.isArray(res.data) ? res.data : [];
          const mapped = data
            .filter((entry) => entry?.role === 'ETUDIANT' || entry?.role === 'ENCADRANT')
            .map((entry) => ({
              id: String(entry.id_user ?? entry.id ?? entry.utilisateur_id ?? entry.user_id),
              label: `${entry.prenom ?? ''} ${entry.nom ?? ''}`.trim() || entry.login || 'Utilisateur',
              role: entry.role,
              email: entry.email,
            }))
            .filter((entry) => entry.id && entry.id !== 'undefined');
          setRecipients(mapped);
        } else if (role === 'ENCADRANT') {
          const encadrantId = (user as any)?.id_specifique || (user as any)?.id_encadrant;
          if (!encadrantId) {
            console.warn('Encadrant ID manquant pour charger les destinataires.');
            setRecipients([]);
            setRecipientsError("Impossible de déterminer l'encadrant.");
            return;
          }
          const res = await api.get(`/api/encadrant/rapports?id_encadrant=${encadrantId}`);
          const data = Array.isArray(res.data) ? res.data : [];
          const uniqueMap = new Map<string, RecipientOption>();
          data.forEach((report) => {
            const studentId = report?.id_etudiant ?? report?.id_user ?? report?.id_etudiant_fk;
            if (!studentId) return;
            const label = `${report?.prenom_etudiant ?? ''} ${report?.nom_etudiant ?? ''}`.trim();
            if (!label) return;
            uniqueMap.set(String(studentId), {
              id: String(studentId),
              label,
              role: 'ETUDIANT',
              email: report?.email_etudiant,
            });
          });
          setRecipients(Array.from(uniqueMap.values()));
        }
      } catch (error) {
        console.error('Erreur chargement destinataires', error);
        setRecipients([]);
        setRecipientsError('Impossible de charger les destinataires.');
      } finally {
        setRecipientsLoading(false);
      }
    };
    fetchRecipients();
  }, [open, role, user, canSend]);

  useEffect(() => {
    if (!open) {
      setSelectedRecipient('');
      setTitle('');
      setMessage('');
      setLink('');
      setRecipients([]);
      setRecipientsError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedRecipient || !title.trim() || !message.trim()) {
      toast.error('Veuillez renseigner tous les champs obligatoires.');
      return;
    }
    if (!canSend || !role) return;
    setSending(true);
    try {
      const payload =
        role === 'ADMIN'
          ? {
              title: title.trim(),
              message: message.trim(),
              type: 'SYSTEM',
              audience: 'custom',
              target_id: selectedRecipient,
              lien: link.trim() || undefined,
            }
          : {
              title: title.trim(),
              message: message.trim(),
              type: 'SYSTEM',
              target_id: selectedRecipient,
              lien: link.trim() || undefined,
            };

      const endpoint = role === 'ADMIN' ? '/api/admin/notifications/send' : '/api/encadrant/notifications/send';
      await api.post(endpoint, payload);
      toast.success('Message envoyé avec succès.');
      onOpenChange(false);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        console.warn(`Endpoint de notification indisponible: ${role === 'ADMIN' ? '/api/admin/notifications/send' : '/api/encadrant/notifications/send'}`);
      }
      console.error('Erreur envoi notification', error);
      toast.error("Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  if (!canSend) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer un message</DialogTitle>
          <DialogDescription>Les messages sont envoyés via les notifications système.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destinataire</Label>
            {recipientsLoading ? (
              <div className="text-sm text-muted-foreground">Chargement des destinataires...</div>
            ) : recipientsError ? (
              <div className="text-sm text-destructive">{recipientsError}</div>
            ) : recipients.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun destinataire disponible.</div>
            ) : (
              <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un destinataire" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {recipients.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      {buildRecipientLabel(recipient)} ({recipient.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="message-title">Titre</Label>
            <Input
              id="message-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titre de la notification"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message-body">Message</Label>
            <Textarea
              id="message-body"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Votre message..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message-link">Lien (optionnel)</Label>
            <Input
              id="message-link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={sending || recipientsLoading || recipients.length === 0}>
            {sending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
