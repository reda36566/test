import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { HistoriqueAction, ActionType } from '@/types';
import { historiqueActions as seedActions } from '@/data/mockData';

interface AuditContextValue {
  actions: HistoriqueAction[];
  addAction: (action: Omit<HistoriqueAction, 'id' | 'date_action'> & { date_action?: string }) => void;
  getActionsByUserId: (userId: string) => HistoriqueAction[];
}

const AuditContext = createContext<AuditContextValue | undefined>(undefined);

const STORAGE_KEY = 'ensa_reports_audit';

const buildAction = (action: Omit<HistoriqueAction, 'id' | 'date_action'> & { date_action?: string }): HistoriqueAction => ({
  ...action,
  id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  date_action: action.date_action ?? new Date().toISOString(),
});

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<HistoriqueAction[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setActions(JSON.parse(stored));
        return;
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setActions(seedActions);
  }, []);

  useEffect(() => {
    if (actions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    }
  }, [actions]);

  const addAction = (action: Omit<HistoriqueAction, 'id' | 'date_action'> & { date_action?: string }) => {
    setActions((prev) => [buildAction(action), ...prev]);
  };

  const getActionsByUserId = (userId: string) =>
    actions
      .filter((entry) => entry.utilisateur_id === userId)
      .sort((a, b) => new Date(b.date_action).getTime() - new Date(a.date_action).getTime());

  const value = useMemo(
    () => ({
      actions,
      addAction,
      getActionsByUserId,
    }),
    [actions]
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
}

export const actionLabels: Record<ActionType, string> = {
  CREATE: 'Création',
  UPDATE: 'Mise à jour',
  DELETE: 'Suppression',
  SUBMIT: 'Soumission',
  VALIDATE: 'Validation',
  REFUSE: 'Refus',
  COMMENT: 'Commentaire',
  UPLOAD: 'Upload',
  GRADE: 'Notation',
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
};
