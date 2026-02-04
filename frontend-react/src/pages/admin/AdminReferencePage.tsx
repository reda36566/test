import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AdminReferencePage() {
  const [activeTab, setActiveTab] = useState('types');
  const [loading, setLoading] = useState(true);
  
  const [types, setTypes] = useState<any[]>([]);
  const [statuts, setStatuts] = useState<any[]>([]);

  const [search, setSearch] = useState('');

  // 1. CHARGEMENT
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            // AJOUTEZ "http://localhost:3000" DEVANT CHAQUE URL 👇
            const [resTypes, resStatuts] = await Promise.all([
                api.get('http://localhost:3000/api/admin/ref/types'),
                api.get('http://localhost:3000/api/admin/ref/statuts')
            ]);
            
            // Le reste ne change pas...
            setTypes(resTypes.data);
            setStatuts(resStatuts.data);
        } catch (error) {
            console.error("Erreur API Référentiel:", error);
            toast.error("Impossible de charger le référentiel");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const filteredTypes = useMemo(() => {
    return types.filter((type) => type.libelle.toLowerCase().includes(search.toLowerCase()));
  }, [types, search]);

  const filteredStatuts = useMemo(() => {
    return statuts.filter((statut) => statut.libelle.toLowerCase().includes(search.toLowerCase()));
  }, [statuts, search]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <AppLayout>
      <PageHeader
        title="Référentiel"
        description="Configurez les types de rapports, statuts et règles de dépôt"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="types">Types de rapports</TabsTrigger>
          <TabsTrigger value="statuts">Statuts</TabsTrigger>
        </TabsList>

        <Card>
            <CardHeader><CardTitle>Filtres</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                <Label htmlFor="search">Recherche</Label>
                <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." />
                </div>
            </CardContent>
        </Card>

        <TabsContent value="types">
          <ReferenceTable
            title="Types de rapports"
            addLabel="Ajouter un type"
            columns={['Code', 'Libellé', 'Durée min (j)', 'Durée max (j)', 'Entreprise requise']}
            idKey="id_type"
            data={filteredTypes}
            onAdd={async (values) => {
                const res = await api.post('/api/admin/ref/types', values);
                setTypes([...types, res.data]);
                toast.success('Ajouté');
            }}
            onEdit={async (id, values) => {
                await api.put(`/api/admin/ref/types/${id}`, values);
                setTypes(prev => prev.map(t => t.id_type === id ? {...t, ...values} : t));
                toast.success('Modifié');
            }}
            onDelete={async (id) => {
                await api.delete(`/api/admin/ref/types/${id}`);
                setTypes(prev => prev.filter(t => t.id_type !== id));
                toast.success('Supprimé');
            }}
          />
        </TabsContent>

        <TabsContent value="statuts">
          <ReferenceTable
            title="Statuts"
            addLabel="Ajouter un statut"
            columns={['Code', 'Libellé', 'Ordre', 'Actif']}
            idKey="id_statut"
            data={filteredStatuts}
            onAdd={async (values) => {
                const res = await api.post('/api/admin/ref/statuts', values);
                setStatuts([...statuts, res.data]);
                toast.success('Ajouté');
            }}
            onEdit={async (id, values) => {
                await api.put(`/api/admin/ref/statuts/${id}`, values);
                setStatuts(prev => prev.map(s => s.id_statut === id ? {...s, ...values} : s));
                toast.success('Modifié');
            }}
            onDelete={async (id) => {
                await api.delete(`/api/admin/ref/statuts/${id}`);
                setStatuts(prev => prev.filter(s => s.id_statut !== id));
                toast.success('Supprimé');
            }}
            showActive
          />
        </TabsContent>

      </Tabs>
    </AppLayout>
  );
}

// COMPOSANTS INTERNES GÉNÉRIQUES

interface ReferenceTableProps {
  title: string;
  addLabel: string;
  columns: string[];
  data: Array<any>;
  idKey: string;
  onAdd: (values: any) => void;
  onEdit: (id: any, values: any) => void;
  onDelete: (id: any) => void;
  showActive?: boolean;
}

function ReferenceTable({ title, addLabel, columns, data, idKey, onAdd, onEdit, onDelete, showActive }: ReferenceTableProps) {
  const [editingId, setEditingId] = useState<any | null>(null);
  
  // 1. Détection : Est-ce qu'on est sur le tableau des Types ?
  const isType = title.includes('Types');

  return (
    <Card>
      {/* ... (Header reste inchangé) ... */}
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => <TableHead key={col}>{col}</TableHead>)}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center p-4 text-muted-foreground">Aucune donnée</TableCell></TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item[idKey]}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                  
                  {/* Champs spécifiques aux TYPES */}
                  {'duree_min_jours' in item && <TableCell>{item.duree_min_jours}</TableCell>}
                  {'duree_max_jours' in item && <TableCell>{item.duree_max_jours}</TableCell>}
                  {'entreprise_requise' in item && (
                    <TableCell><Badge variant={item.entreprise_requise ? 'default' : 'secondary'}>{item.entreprise_requise ? 'Oui' : 'Non'}</Badge></TableCell>
                  )}
                  
                  {/* --- CORRECTION ICI : On ajoute !isType && --- */}
                  {/* On cache ces colonnes si c'est un tableau de Types */}
                  
                  {!isType && 'ordre' in item && <TableCell>{item.ordre}</TableCell>}
                  
                  {!isType && 'actif' in item && (
                    <TableCell><Badge variant={item.actif ? 'default' : 'secondary'}>{item.actif ? 'Actif' : 'Inactif'}</Badge></TableCell>
                  )}
                  
                  <TableCell className="text-right space-x-2">
                    <ReferenceDialog
                      triggerLabel="Modifier"
                      defaultValues={item}
                      onSubmit={(v) => { onEdit(item[idKey], v); setEditingId(null); }}
                      showActive={showActive}
                      isType={isType} // On passe bien l'info ici
                      openState={editingId === item[idKey]}
                      onOpenChange={(open) => setEditingId(open ? item[idKey] : null)}
                    />
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(item[idKey])}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// DIALOGUE GÉNÉRIQUE
function ReferenceDialog({ triggerLabel, defaultValues, onSubmit, showActive, openState, onOpenChange, isType }: any) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const isControlled = openState !== undefined;
  const dialogOpen = isControlled ? openState : open;

  useEffect(() => { if(dialogOpen) setValues(defaultValues); }, [dialogOpen]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleSubmit = () => {
    if (!values.code || !values.libelle) {
      toast.error('Champs obligatoires manquants');
      return;
    }
    onSubmit(values);
    handleOpenChange(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={triggerLabel === 'Modifier' ? 'outline' : 'default'} size="sm">
          {triggerLabel === 'Modifier' ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
          <DialogDescription>Complétez les informations.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input value={values.code || ''} onChange={(e) => setValues(p => ({ ...p, code: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Libellé</Label>
            <Input value={values.libelle || ''} onChange={(e) => setValues(p => ({ ...p, libelle: e.target.value }))} />
          </div>
          
          {/* Champs spécifiques aux TYPES */}
          {isType && (
            <>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Durée min (j)</Label>
                        <Input type="number" value={values.duree_min_jours || 0} onChange={(e) => setValues(p => ({ ...p, duree_min_jours: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Durée max (j)</Label>
                        <Input type="number" value={values.duree_max_jours || 0} onChange={(e) => setValues(p => ({ ...p, duree_max_jours: e.target.value }))} />
                    </div>
                </div>
                <div className="flex items-center justify-between border rounded p-3">
                    <span className="font-medium text-sm">Entreprise requise</span>
                    <Switch checked={!!values.entreprise_requise} onCheckedChange={(c) => setValues(p => ({ ...p, entreprise_requise: c }))} />
                </div>
            </>
          )}

          {/* Champs spécifiques aux STATUTS */}
          {!isType && (
             <div className="space-y-2">
                <Label>Ordre</Label>
                <Input type="number" value={values.ordre || 1} onChange={(e) => setValues(p => ({ ...p, ordre: e.target.value }))} />
             </div>
          )}

          {showActive && (
            <div className="flex items-center justify-between border rounded p-3">
              <span className="font-medium text-sm">Actif</span>
              <Switch checked={!!values.actif} onCheckedChange={(c) => setValues(p => ({ ...p, actif: c }))} />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={values.description || ''} onChange={(e) => setValues(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
