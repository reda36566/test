import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import api from '@/lib/api';

export default function AdminParametresPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState({
    MAX_PDF_SIZE: 10,
    DEPOSIT_START: '',
    DEPOSIT_END: '',
    ALLOW_LATE: false,
    PLAGIARISM_WARN: 15,
    PLAGIARISM_BLOCK: 30,
  });
  const [warningThreshold, setWarningThreshold] = useState(15);
  const [refusalThreshold, setRefusalThreshold] = useState(30);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const resConfig = await api.get('/api/admin/ref/config');
        const config = resConfig.data || {};
        setRules({
          MAX_PDF_SIZE: Number(config.MAX_PDF_SIZE) || 10,
          DEPOSIT_START: config.DEPOSIT_START || '',
          DEPOSIT_END: config.DEPOSIT_END || '',
          ALLOW_LATE: config.ALLOW_LATE === '1' || config.ALLOW_LATE === 'true',
          PLAGIARISM_WARN: Number(config.PLAGIARISM_WARN) || 15,
          PLAGIARISM_BLOCK: Number(config.PLAGIARISM_BLOCK) || 30,
        });
        if (config.plagiat_warning || config.PLAGIARISM_WARN) {
          setWarningThreshold(Number(config.plagiat_warning ?? config.PLAGIARISM_WARN));
        }
        if (config.plagiat_refusal || config.PLAGIARISM_BLOCK) {
          setRefusalThreshold(Number(config.plagiat_refusal ?? config.PLAGIARISM_BLOCK));
        }
      } catch (error) {
        console.error('Erreur API Paramètres:', error);
        toast.error('Impossible de charger les paramètres');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveRules = async () => {
    try {
      await api.post('/api/admin/ref/config', {
        ...rules,
        ALLOW_LATE: rules.ALLOW_LATE ? '1' : '0',
      });
      toast.success('Règles de dépôt sauvegardées');
    } catch (error) {
      toast.error('Erreur sauvegarde');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.post('/api/admin/ref/config', {
        plagiat_warning: warningThreshold,
        plagiat_refusal: refusalThreshold,
      });
      toast.success('Paramètres de détection mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des paramètres');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Paramètres de la plateforme"
        description="Configuration globale et règles de dépôt."
        actions={
          <Button variant="default" onClick={handleSaveSettings}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Sauvegarder les seuils
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Règles de dépôt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-size">Taille max PDF (MB)</Label>
                <Input
                  id="max-size"
                  type="number"
                  value={rules.MAX_PDF_SIZE}
                  onChange={(e) => setRules((p) => ({ ...p, MAX_PDF_SIZE: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit-start">Début dépôt</Label>
                <Input
                  id="deposit-start"
                  type="date"
                  value={rules.DEPOSIT_START}
                  onChange={(e) => setRules((p) => ({ ...p, DEPOSIT_START: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit-end">Fin dépôt</Label>
                <Input
                  id="deposit-end"
                  type="date"
                  value={rules.DEPOSIT_END}
                  onChange={(e) => setRules((p) => ({ ...p, DEPOSIT_END: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Retard autorisé</Label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rules.ALLOW_LATE}
                    onCheckedChange={(c) => setRules((p) => ({ ...p, ALLOW_LATE: c }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    Autoriser dépôt après la date limite
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plagiarism-warn">Seuil warning (%)</Label>
                <Input
                  id="plagiarism-warn"
                  type="number"
                  value={rules.PLAGIARISM_WARN}
                  onChange={(e) =>
                    setRules((p) => ({ ...p, PLAGIARISM_WARN: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plagiarism-block">Seuil refus (%)</Label>
                <Input
                  id="plagiarism-block"
                  type="number"
                  value={rules.PLAGIARISM_BLOCK}
                  onChange={(e) =>
                    setRules((p) => ({ ...p, PLAGIARISM_BLOCK: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <Button onClick={handleSaveRules}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les règles
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paramètres globaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">
                Ces seuils s&apos;appliquent à tous les rapports déposés. Une alerte est envoyée
                si le score dépasse le seuil warning.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Seuil d&apos;Avertissement (%)</Label>
              <Input
                type="number"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Seuil de Refus Automatique (%)</Label>
              <Input
                type="number"
                value={refusalThreshold}
                onChange={(e) => setRefusalThreshold(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
