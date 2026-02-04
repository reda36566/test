import { cn } from '@/lib/utils';
import { StatutRapport } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  FileEdit,
  Send,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Archive,
} from 'lucide-react';

interface StatusBadgeProps {
  status: StatutRapport;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<StatutRapport, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  Draft: {
    label: 'Brouillon',
    className: 'bg-muted text-muted-foreground border-muted',
    icon: FileEdit,
  },
  Submitted: {
    label: 'Soumis',
    className: 'bg-info/10 text-info border-info/30',
    icon: Send,
  },
  UnderReview: {
    label: 'En évaluation',
    className: 'bg-warning/10 text-warning border-warning/30',
    icon: Eye,
  },
  CorrectionsRequested: {
    label: 'Corrections demandées',
    className: 'bg-orange-100 text-orange-700 border-orange-300',
    icon: AlertCircle,
  },
  Validated: {
    label: 'Validé',
    className: 'bg-success/10 text-success border-success/30',
    icon: CheckCircle,
  },
  Refused: {
    label: 'Refusé',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
    icon: XCircle,
  },
  Archived: {
    label: 'Archivé',
    className: 'bg-slate-100 text-slate-600 border-slate-300',
    icon: Archive,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function StatusBadge({ status, showIcon = true, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium inline-flex items-center gap-1.5',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn('flex-shrink-0', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />}
      {config.label}
    </Badge>
  );
}
