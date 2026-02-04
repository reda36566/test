import { cn } from '@/lib/utils';
import { StatutRapport } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface CompactTimelineEvent {
  statut: StatutRapport;
  date?: string;
  completed: boolean;
}

interface CompactStatusTimelineProps {
  events: CompactTimelineEvent[];
  className?: string;
}

const statusOrder: StatutRapport[] = [
  'Draft',
  'Submitted',
  'UnderReview',
  'Validated',
];

const statusLabels: Record<StatutRapport, string> = {
  Draft: 'Brouillon',
  Submitted: 'Soumis',
  UnderReview: 'En examen',
  CorrectionsRequested: 'Corrections',
  Validated: 'Validé',
  Refused: 'Refusé',
  Archived: 'Archivé',
};

const statusColors: Record<StatutRapport, { 
  completed: string; 
  pending: string;
  line: string;
}> = {
  Draft: {
    completed: 'bg-muted-foreground text-background',
    pending: 'border-muted-foreground/40 text-muted-foreground',
    line: 'bg-muted-foreground',
  },
  Submitted: {
    completed: 'bg-info text-white',
    pending: 'border-info/40 text-info',
    line: 'bg-info',
  },
  UnderReview: {
    completed: 'bg-warning text-white',
    pending: 'border-warning/40 text-warning',
    line: 'bg-warning',
  },
  CorrectionsRequested: {
    completed: 'bg-orange-500 text-white',
    pending: 'border-orange-500/40 text-orange-500',
    line: 'bg-orange-500',
  },
  Validated: {
    completed: 'bg-success text-white',
    pending: 'border-success/40 text-success',
    line: 'bg-success',
  },
  Refused: {
    completed: 'bg-destructive text-white',
    pending: 'border-destructive/40 text-destructive',
    line: 'bg-destructive',
  },
  Archived: {
    completed: 'bg-slate-500 text-white',
    pending: 'border-slate-500/40 text-slate-500',
    line: 'bg-slate-500',
  },
};

export function CompactStatusTimeline({ events, className }: CompactStatusTimelineProps) {
  return (
    <TooltipProvider>
      <div className={cn('flex items-center', className)}>
        {events.map((event, index) => {
          const colors = statusColors[event.statut];
          const isLast = index === events.length - 1;
          const nextEvent = events[index + 1];
          const lineCompleted = nextEvent?.completed;

          return (
            <div key={event.statut} className="flex items-center">
              {/* Node */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                      event.completed
                        ? colors.completed
                        : cn('bg-background', colors.pending)
                    )}
                  >
                    {event.completed ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{statusLabels[event.statut]}</p>
                    {event.date && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.date), "d MMM yyyy", { locale: fr })}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'h-1 w-12 transition-colors',
                    lineCompleted ? colors.line : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// Helper to generate timeline from current status
export function generateTimelineFromStatus(
  currentStatus: StatutRapport,
  statusHistory?: { statut: StatutRapport; date: string }[]
): CompactTimelineEvent[] {
  const standardFlow = statusOrder;
  const historyMap = new Map(
    statusHistory?.map(h => [h.statut, h.date]) || []
  );

  // Find current status index
  const currentIndex = standardFlow.indexOf(currentStatus);

  return standardFlow.map((statut, index) => ({
    statut,
    date: historyMap.get(statut),
    completed: index <= currentIndex || historyMap.has(statut),
  }));
}
