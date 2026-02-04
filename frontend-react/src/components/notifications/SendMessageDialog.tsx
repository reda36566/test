import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MailPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageAudience = 'all' | 'encadrants' | 'etudiants' | 'custom';

export interface MessageRecipient {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

interface SendMessageDialogProps {
  role: 'ADMIN' | 'ENCADRANT';
  recipients: MessageRecipient[];
  loadingRecipients?: boolean;
  disabled?: boolean;
  onSubmit: (payload: {
    title: string;
    message: string;
    link?: string;
    type: string;
    audience: MessageAudience;
    recipientIds: string[];
  }) => Promise<void>;
  triggerLabel?: string;
}

const MESSAGE_TYPES = [
  { value: 'SYSTEM', label: 'Système (Info)' },
  { value: 'WARNING', label: 'Avertissement' },
  { value: 'URGENT', label: 'Urgent' },
];

export function SendMessageDialog({
  role,
  recipients,
  loadingRecipients,
  disabled,
  onSubmit,
  triggerLabel = 'Envoyer un message',
}: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [audience, setAudience] = useState<MessageAudience>(role === 'ADMIN' ? 'all' : 'custom');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const filteredRecipients = useMemo(() => {
    if (audience !== 'custom') return recipients;
    return recipients;
  }, [audience, recipients]);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setLink('');
    setType('SYSTEM');
    setAudience(role === 'ADMIN' ? 'all' : 'custom');
    setSelectedIds([]);
  };

  const handleToggleRecipient = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) return;
    if (audience === 'custom' && selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
        type,
        audience,
        recipientIds: selectedIds,
      });
      setOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim() && message.trim() && (audience !== 'custom' || selectedIds.length > 0);

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" disabled={disabled}>
          <MailPlus className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer un message</DialogTitle>
          <DialogDescription>
            Envoyez une notification ciblée avec un titre, un message et un lien optionnel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {role === 'ADMIN' ? (
            <div className="grid gap-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(value) => setAudience(value as MessageAudience)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="encadrants">Encadrants</SelectItem>
                  <SelectItem value="etudiants">Étudiants</SelectItem>
                  <SelectItem value="custom">Sélectionner des utilisateurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">Étudiants supervisés</p>
                <p className="text-xs text-muted-foreground">Messages uniquement vers vos étudiants.</p>
              </div>
              <Badge variant="secondary">Encadrant</Badge>
            </div>
          )}

          {audience === 'custom' && (
            <div className="grid gap-2">
              <Label>Destinataires</Label>
              <ScrollArea className="h-44 rounded-lg border">
                <div className="space-y-2 p-3">
                  {loadingRecipients ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des destinataires...
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun destinataire disponible.</p>
                  ) : (
                    filteredRecipients.map((recipient) => (
                      <label
                        key={recipient.id}
                        className={cn(
                          'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
                          selectedIds.includes(recipient.id) && 'border-primary/50 bg-primary/5'
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.includes(recipient.id)}
                          onCheckedChange={() => handleToggleRecipient(recipient.id)}
                        />
                        <span className="flex-1">
                          <span className="font-medium">{recipient.name}</span>
                          {recipient.email && (
                            <span className="block text-xs text-muted-foreground">{recipient.email}</span>
                          )}
                        </span>
                        {recipient.role && (
                          <Badge variant="outline" className="text-[10px]">
                            {recipient.role}
                          </Badge>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((messageType) => (
                  <SelectItem key={messageType.value} value={messageType.value}>
                    {messageType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Titre</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre de la notification" />
          </div>
          <div className="grid gap-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Votre message..." />
          </div>
          <div className="grid gap-2">
            <Label>Lien optionnel</Label>
            <Input value={link} onChange={(event) => setLink(event.target.value)} placeholder="/student/report/123" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailPlus className="mr-2 h-4 w-4" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
