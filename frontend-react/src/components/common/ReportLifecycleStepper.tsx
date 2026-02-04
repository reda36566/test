import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, FileText, AlertTriangle, Upload } from 'lucide-react';
import { format } from 'date-fns';

type ReportVersion = {
  numero_version?: number;
  date_depot?: string;
};

type ReportLifecycleStepperProps = {
  statusId?: number | null;
  statusLabel?: string | null;
  versions?: ReportVersion[];
};

const steps = [
  {
    key: 'draft',
    title: 'Brouillon / Initialisé',
    description: 'Vous déposez un premier PDF pour démarrer le dossier.',
    icon: Upload,
  },
  {
    key: 'submitted',
    title: 'Soumis / En révision',
    description: 'Le rapport est envoyé à l’encadrant pour analyse.',
    icon: Clock,
  },
  {
    key: 'needs_changes',
    title: 'À corriger',
    description: 'Des corrections sont demandées, vous déposez une nouvelle version.',
    icon: AlertTriangle,
  },
  {
    key: 'validated',
    title: 'Validé',
    description: 'Le rapport est validé et peut être noté.',
    icon: CheckCircle,
  },
];

const normalizeStatusLabel = (label?: string | null) => (label || '').trim();

const statusLabelFromId = (statusId?: number | null) => {
  if (!statusId) return '';
  if (statusId === 1) return 'Initialisé';
  if (statusId === 2) return 'Soumis';
  if (statusId === 3) return 'Validé';
  if (statusId === 4) return 'À corriger';
  return '';
};

const getStepIndex = (statusLabel?: string | null, statusId?: number | null) => {
  const normalizedLabel = normalizeStatusLabel(statusLabel || statusLabelFromId(statusId));
  if (normalizedLabel === 'Initialisé') return { index: 0, unknown: false, label: normalizedLabel };
  if (normalizedLabel === 'Soumis' || normalizedLabel === 'En cours de correction') {
    return { index: 1, unknown: false, label: normalizedLabel };
  }
  if (normalizedLabel === 'À corriger') return { index: 2, unknown: false, label: normalizedLabel };
  if (normalizedLabel === 'Validé') return { index: 3, unknown: false, label: normalizedLabel };
  return { index: 0, unknown: true, label: 'Étape inconnue' };
};

const getLatestVersion = (versions?: ReportVersion[]) => {
  if (!versions || versions.length === 0) return null;
  return versions.reduce<ReportVersion | null>((latest, current) => {
    if (!latest) return current;
    const latestNumber = latest.numero_version ?? 0;
    const currentNumber = current.numero_version ?? 0;
    return currentNumber >= latestNumber ? current : latest;
  }, null);
};

export function ReportLifecycleStepper({ statusId, statusLabel, versions }: ReportLifecycleStepperProps) {
  const currentStep = getStepIndex(statusLabel, statusId);
  const latestVersion = getLatestVersion(versions);
  const latestVersionLabel = latestVersion?.numero_version
    ? `Dernière version: V${latestVersion.numero_version}`
    : 'Dernière version disponible';
  const latestVersionDate = latestVersion?.date_depot
    ? format(new Date(latestVersion.date_depot), 'dd/MM/yyyy HH:mm')
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Cycle de vie du rapport
          </CardTitle>
          <Badge variant={currentStep.unknown ? 'destructive' : 'secondary'}>
            {currentStep.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep.index;
            const isCompleted = index < currentStep.index;
            return (
              <div
                key={step.key}
                className={cn(
                  'rounded-lg border p-4 transition-colors',
                  isActive && 'border-primary bg-primary/5',
                  isCompleted && 'border-emerald-200 bg-emerald-50/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-xs font-semibold text-muted-foreground">Étape {index + 1}</span>
                </div>
                <p className={cn('mt-2 text-sm font-semibold', isActive && 'text-primary')}>{step.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Que faire à chaque étape ?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Déposez un PDF complet dès l’étape brouillon.</li>
            <li>Surveillez les notifications après la soumission.</li>
            <li>En cas de correction, envoyez une version révisée rapidement.</li>
            <li>Après validation, vérifiez la note et les commentaires.</li>
          </ul>
        </div>

        {versions && versions.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {latestVersionLabel}
            {latestVersionDate ? ` – ${latestVersionDate}` : ''}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Dernière version disponible</p>
        )}
      </CardContent>
    </Card>
  );
}
