import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Search } from 'lucide-react';
import api from '@/lib/api';

export default function AdminPlagiarismPage() {
  const [loading, setLoading] = useState(true);
  const [plagiatData, setPlagiatData] = useState<any[]>([]);
  
  // Filtres UI
  const [searchQuery, setSearchQuery] = useState('');
  const [thresholdFilter, setThresholdFilter] = useState('all');
  
  const warningThreshold = 15;
  const refusalThreshold = 30;

  // État pour la décision
  const [decision, setDecision] = useState('');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  // 1. CHARGEMENT DES DONNÉES
  const fetchData = async () => {
    setLoading(true);
    try {
      const resPlagiat = await api.get('/api/admin/plagiat');
      
      setPlagiatData(resPlagiat.data || []);
    } catch (error) {
      toast.error("Erreur de chargement des données de plagiat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. FILTRAGE
  const filteredCases = useMemo(() => {
    return plagiatData.filter((item) => {
      const matchesSearch = item.titre?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.nom?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesThreshold =
        thresholdFilter === 'all' ||
        (thresholdFilter === 'warning' && item.score_similitude >= warningThreshold) ||
        (thresholdFilter === 'refusal' && item.score_similitude >= refusalThreshold);

      return matchesSearch && matchesThreshold;
    });
  }, [plagiatData, searchQuery, thresholdFilter, warningThreshold, refusalThreshold]);

  // 4. ENREGISTRER UNE DÉCISION
  const handleDecisionSave = async () => {
    if (!selectedCase || !decision) return;

    try {
      // On utilise la route de notification existante pour avertir l'étudiant
      await api.post('/api/admin/notifications/send', {
        title: 'Analyse Plagiat',
        message: `Une décision a été rendue sur votre rapport : ${decision}`,
        type: 'PLAGIARISM_ALERT',
        audience: 'custom',
        target_id: selectedCase.id_user // Assurez-vous que l'API renvoie id_user
      });

      toast.success('Décision enregistrée et notification envoyée');
      setDecision('');
      setSelectedCase(null);
      fetchData(); // Rafraîchir la liste
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <AppLayout>
      <PageHeader
        title="Plagiat"
        description="Gestion des analyses de similarité et décisions"
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Résultats d'analyse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un rapport ou étudiant..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={thresholdFilter} onValueChange={setThresholdFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par seuil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les scores</SelectItem>
                  <SelectItem value="warning">≥ {warningThreshold}% (Avertissement)</SelectItem>
                  <SelectItem value="refusal">≥ {refusalThreshold}% (Critique)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapport & Étudiant</TableHead>
                    <TableHead>Similarité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date Analyse</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun cas détecté</TableCell></TableRow>
                  ) : (
                    filteredCases.map((item) => (
                      <TableRow key={item.id_plagiat}>
                        <TableCell>
                          <div className="font-medium">{item.titre}</div>
                          <div className="text-xs text-muted-foreground">{item.prenom} {item.nom}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.score_similitude >= refusalThreshold ? 'destructive' : item.score_similitude >= warningThreshold ? 'secondary' : 'outline'}>
                            {item.score_similitude}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{item.statut}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(item.date_analyse).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedCase(item)}>Décider</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* MODAL DE DÉCISION */}
      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Décision : {selectedCase?.titre}</DialogTitle>
            <DialogDescription>
              Le score de similarité est de <strong>{selectedCase?.score_similitude}%</strong>. 
              Quelle suite donner à ce rapport ?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Justification et instructions pour l'étudiant</Label>
            <Textarea
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="Ex: Taux trop élevé, veuillez reformuler les parties surlignées dans le rapport complet..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCase(null)}>Annuler</Button>
            <Button onClick={handleDecisionSave}>Enregistrer & Avertir l'étudiant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
