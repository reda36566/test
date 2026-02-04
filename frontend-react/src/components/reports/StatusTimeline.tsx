import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatutRapport } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  FileEdit, 
  Send, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Archive,
  User,
  Clock
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  statut: StatutRapport;
  date: string;
  auteur?: string;
  commentaire?: string;
}

interface StatusTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const statusConfig: Record<StatutRapport, { 
  icon: React.ElementType; 
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  Draft: { 
    icon: FileEdit, 
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    borderClass: 'border-muted-foreground/30'
  },
  Submitted: { 
    icon: Send, 
    colorClass: 'text-info',
    bgClass: 'bg-info/10',
    borderClass: 'border-info/30'
  },
  UnderReview: { 
    icon: Eye, 
    colorClass: 'text-warning',
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/30'
  },
  CorrectionsRequested: { 
    icon: AlertCircle, 
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30'
  },
  Validated: { 
    icon: CheckCircle, 
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/30'
  },
  Refused: { 
    icon: XCircle, 
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/30'
  },
  Archived: { 
    icon: Archive, 
    colorClass: 'text-slate-500',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/30'
  },
};

const statusLabels: Record<StatutRapport, string> = {
  Draft: 'Brouillon créé',
  Submitted: 'Rapport soumis',
  UnderReview: 'En cours d\'examen',
  CorrectionsRequested: 'Corrections demandées',
  Validated: 'Rapport validé',
  Refused: 'Rapport refusé',
  Archived: 'Rapport archivé',
};

export function StatusTimeline({ events, className }: StatusTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun historique disponible
      </div>
    );
  }

  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {sortedEvents.map((event, index) => {
          const config = statusConfig[event.statut];
          const Icon = config.icon;
          const isFirst = index === 0;

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Timeline node */}
              <div
                className={cn(
                  'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2',
                  config.bgClass,
                  config.borderClass,
                  isFirst && 'ring-4 ring-primary/20'
                )}
              >
                <Icon className={cn('h-5 w-5', config.colorClass)} />
              </div>

              {/* Content */}
              <div className={cn(
                'flex-1 rounded-lg border p-4 transition-colors',
                isFirst ? 'bg-card border-primary/20 shadow-sm' : 'bg-muted/30'
              )}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">
                        {statusLabels[event.statut]}
                      </h4>
                      <StatusBadge status={event.statut} />
                    </div>
                    
                    {event.commentaire && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {event.commentaire}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(event.date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                      </span>
                    </div>
                    {event.auteur && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>{event.auteur}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
