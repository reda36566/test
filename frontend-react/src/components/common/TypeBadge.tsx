import { cn } from '@/lib/utils';
import { TypeRapport } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FolderKanban, GraduationCap } from 'lucide-react';

interface TypeBadgeProps {
  type: TypeRapport;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const typeConfig: Record<TypeRapport, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  Stage: {
    label: 'Stage',
    className: 'bg-purple-100 text-purple-700 border-purple-300',
    icon: Briefcase,
  },
  Projet: {
    label: 'Projet',
    className: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: FolderKanban,
  },
  PFE: {
    label: 'PFE',
    className: 'bg-amber-100 text-amber-700 border-amber-300',
    icon: GraduationCap,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function TypeBadge({ type, showIcon = true, size = 'md', className }: TypeBadgeProps) {
  const config = typeConfig[type];
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
