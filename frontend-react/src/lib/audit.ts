import api from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface AuditLog {
  id_action: number;
  id_user: number;
  type_action: string;
  details: string;
  date_action: string;
  login?: string;
  role?: string;
}

export const actionLabels: Record<string, string> = {
  LOGIN: 'Connexion',
  UPDATE: 'Mise à jour',
  CREATE: 'Création',
  DELETE: 'Suppression',
  EVALUATION: 'Évaluation',
  UPLOAD: 'Dépôt',
  CONNEXION: 'Connexion au site',
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const res = await api.get('/api/historique');
  return Array.isArray(res.data) ? res.data : [];
};

export const getActorLabel = (entry: AuditLog) => entry.login || `Utilisateur #${entry.id_user}`;

export const getRoleLabel = (entry: AuditLog) => entry.role || 'Rôle inconnu';

export const getActionLabel = (entry: AuditLog) => actionLabels[entry.type_action] || entry.type_action;

export const formatAuditDate = (dateAction: string) =>
  format(new Date(dateAction), 'dd/MM/yyyy HH:mm', { locale: fr });

export const formatAuditEntry = (entry: AuditLog) => ({
  ...entry,
  actorLabel: getActorLabel(entry),
  roleLabel: getRoleLabel(entry),
  actionLabel: getActionLabel(entry),
  dateLabel: formatAuditDate(entry.date_action),
});
