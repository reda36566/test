import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/api'; // Assurez-vous que ce fichier existe

export default function AdminAcademicPage() {
  const [activeTab, setActiveTab] = useState('departements');
  const [loading, setLoading] = useState(true);

  // États des données (Initialisés vides)
  const [departementList, setDepartementList] = useState<any[]>([]);
  const [filiereList, setFiliereList] = useState<any[]>([]);
  const [niveauList, setNiveauList] = useState<any[]>([]);
  const [moduleList, setModuleList] = useState<any[]>([]);
  const [anneeList, setAnneeList] = useState<any[]>([]);

  // Filtres
  const [search, setSearch] = useState('');
  const [selectedDepartement, setSelectedDepartement] = useState('all');
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [selectedNiveau, setSelectedNiveau] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [deleteItem, setDeleteItem] = useState<{ id: any; type: string } | null>(null);

  // 1. CHARGEMENT DES DONNÉES
  const fetchData = async () => {
    setLoading(true);
    try {
        const [resDep, resFil, resNiv, resMod, resAnnee] = await Promise.all([
            api.get('/api/admin/academic/departements'),
            api.get('/api/admin/academic/filieres'),
            api.get('/api/admin/academic/niveaux'),
            api.get('/api/admin/academic/modules'),
            api.get('/api/admin/academic/annees')
        ]);

        setDepartementList(resDep.data);
        setFiliereList(resFil.data);
        setNiveauList(resNiv.data);
        setModuleList(resMod.data);
        setAnneeList(resAnnee.data);
    } catch (error) {
        console.error("Erreur chargement", error);
        toast.error("Erreur lors du chargement des données");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIQUE DE FILTRAGE (Reste identique mais sur les données API) ---
  const filteredDepartements = useMemo(() => {
    return departementList.filter((dep) => {
      const matchesSearch = dep.nom.toLowerCase().includes(search.toLowerCase()) || (dep.code && dep.code.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? dep.actif : !dep.actif);
      return matchesSearch && matchesStatus;
    });
  }, [departementList, search, statusFilter]);

  const filteredFilieres = useMemo(() => {
    return filiereList.filter((filiere) => {
      const matchesSearch = filiere.nom.toLowerCase().includes(search.toLowerCase()) || (filiere.code && filiere.code.toLowerCase().includes(search.toLowerCase()));
      const matchesDep = selectedDepartement === 'all' || filiere.id_departement == selectedDepartement;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? filiere.actif : !filiere.actif);
      return matchesSearch && matchesDep && matchesStatus;
    });
  }, [filiereList, search, selectedDepartement, statusFilter]);

  const filteredNiveaux = useMemo(() => {
    return niveauList.filter((niveau) => {
        const matchesSearch = niveau.nom.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? niveau.actif : !niveau.actif);
        return matchesSearch && matchesStatus;
    });
  }, [niveauList, search, statusFilter]);

  const filteredModules = useMemo(() => {
    return moduleList.filter((module) => {
        const matchesSearch = module.nom.toLowerCase().includes(search.toLowerCase());
        const matchesFiliere = selectedFiliere === 'all' || module.id_filiere == selectedFiliere;
        const matchesNiveau = selectedNiveau === 'all' || module.id_niveau == selectedNiveau;
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? module.actif : !module.actif);
        return matchesSearch && matchesFiliere && matchesNiveau && matchesStatus;
    });
  }, [moduleList, search, selectedFiliere, selectedNiveau, statusFilter]);

  const filteredAnnees = useMemo(() => {
    return anneeList.filter((annee) => {
      const matchesSearch = annee.libelle.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? annee.actuelle : !annee.actuelle);
      return matchesSearch && matchesStatus;
    });
  }, [anneeList, search, statusFilter]);

  const resetFilters = () => {
    setSearch('');
    setSelectedDepartement('all');
    setSelectedFiliere('all');
    setSelectedNiveau('all');
    setStatusFilter('all');
  };

  // 2. SUPPRESSION
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
        let endpoint = '';
        // Mapping type -> endpoint backend
        switch (deleteItem.type) {
            case 'departement': endpoint = 'departements'; break;
            case 'filiere': endpoint = 'filieres'; break;
            case 'niveau': endpoint = 'niveaux'; break;
            case 'module': endpoint = 'modules'; break;
            case 'annee': endpoint = 'annees'; break;
        }

        await api.delete(`/api/admin/academic/${endpoint}/${deleteItem.id}`);
        
        // Mise à jour locale
        if(deleteItem.type === 'departement') setDepartementList(prev => prev.filter(i => i.id_departement !== deleteItem.id));
        if(deleteItem.type === 'filiere') setFiliereList(prev => prev.filter(i => i.id_filiere !== deleteItem.id));
        if(deleteItem.type === 'niveau') setNiveauList(prev => prev.filter(i => i.id_niveau !== deleteItem.id));
        if(deleteItem.type === 'module') setModuleList(prev => prev.filter(i => i.id_module !== deleteItem.id));
        if(deleteItem.type === 'annee') setAnneeList(prev => prev.filter(i => i.id_annee !== deleteItem.id));

        toast.success('Élément supprimé avec succès');
    } catch (error) {
        toast.error("Impossible de supprimer cet élément (peut-être lié à d'autres données)");
    }
    setDeleteItem(null);
  };

  // 3. TOGGLE ANNÉE
  const toggleAcademicYear = async (id: number) => {
    try {
        await api.put(`/api/admin/academic/annees/${id}/toggle`);
        // Mise à jour locale pour refléter le changement (une seule active à la fois)
        setAnneeList(prev => prev.map(a => ({
            ...a,
            actuelle: a.id_annee === id ? 1 : 0
        })));
        toast.success('Année académique mise à jour');
    } catch (error) {
        toast.error("Erreur lors du changement d'année");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary h-10 w-10"/></div>;

  return (
    <AppLayout>
      <PageHeader
        title="Paramètres académiques"
        description="Gérez les structures académiques de l'école"
        actions={
          <Button variant="outline" onClick={resetFilters}>
            Réinitialiser les filtres
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="departements">Départements</TabsTrigger>
          <TabsTrigger value="filieres">Filières</TabsTrigger>
          <TabsTrigger value="niveaux">Niveaux</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="annees">Années acad.</TabsTrigger>
        </TabsList>

        {/* FILTRES COMMUNS */}
        <Card>
          <CardHeader><CardTitle>Filtres</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeTab === 'filieres' && (
              <div className="space-y-2">
                <Label>Département</Label>
                <Select value={selectedDepartement} onValueChange={setSelectedDepartement}>
                  <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {departementList.map((dep) => <SelectItem key={dep.id_departement} value={String(dep.id_departement)}>{dep.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {activeTab === 'modules' && (
              <>
                <div className="space-y-2">
                  <Label>Filière</Label>
                  <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                    <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {filiereList.map((fil) => <SelectItem key={fil.id_filiere} value={String(fil.id_filiere)}>{fil.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* --- ONGLETS --- */}

        <TabsContent value="departements">
          <AcademicSection
            title="Départements"
            addLabel="Ajouter un département"
            idKey="id_departement"
            columns={[
              { label: 'Code', key: 'code' },
              { label: 'Nom', key: 'nom' },
              { label: 'Description', key: 'description' },
              { label: 'Statut', key: 'actif' },
            ]}
            data={filteredDepartements}
            onAdd={async (values) => {
                const res = await api.post('/api/admin/academic/departements', values);
                setDepartementList([res.data, ...departementList]);
                toast.success('Département ajouté');
            }}
            onEdit={async (id, values) => {
                await api.put(`/api/admin/academic/departements/${id}`, values);
                setDepartementList(prev => prev.map(d => d.id_departement === id ? { ...d, ...values } : d));
                toast.success('Mis à jour');
            }}
            onDelete={(id) => setDeleteItem({ id, type: 'departement' })}
            renderStatus={(val) => <Badge variant={val ? 'default' : 'secondary'}>{val ? 'Actif' : 'Inactif'}</Badge>}
          />
        </TabsContent>

        <TabsContent value="filieres">
          <AcademicSection
            title="Filières"
            addLabel="Ajouter une filière"
            idKey="id_filiere"
            columns={[
              { label: 'Code', key: 'code' },
              { label: 'Nom', key: 'nom' },
              { label: 'Département', key: 'id_departement' },
              { label: 'Statut', key: 'actif' },
            ]}
            data={filteredFilieres}
            departements={departementList}
            onAdd={async (values) => {
                const res = await api.post('/api/admin/academic/filieres', values);
                setFiliereList([res.data, ...filiereList]);
                toast.success('Filière ajoutée');
            }}
            onEdit={async (id, values) => {
                await api.put(`/api/admin/academic/filieres/${id}`, values);
                setFiliereList(prev => prev.map(f => f.id_filiere === id ? { ...f, ...values } : f));
                toast.success('Filière mise à jour');
            }}
            onDelete={(id) => setDeleteItem({ id, type: 'filiere' })}
            renderCustomCell={(key, value) => {
                if (key === 'id_departement') return departementList.find(d => d.id_departement === value)?.nom || '-';
                return value;
            }}
            renderStatus={(val) => <Badge variant={val ? 'default' : 'secondary'}>{val ? 'Active' : 'Inactive'}</Badge>}
          />
        </TabsContent>

        <TabsContent value="niveaux">
          <AcademicSection
            title="Niveaux"
            addLabel="Ajouter un niveau"
            idKey="id_niveau"
            columns={[
              { label: 'Code', key: 'code' },
              { label: 'Nom', key: 'nom' },
              { label: 'Ordre', key: 'ordre' },
              { label: 'Statut', key: 'actif' },
            ]}
            data={filteredNiveaux}
            onAdd={async (values) => {
                const res = await api.post('/api/admin/academic/niveaux', values);
                setNiveauList([res.data, ...niveauList]);
                toast.success('Niveau ajouté');
            }}
            onEdit={async (id, values) => {
                await api.put(`/api/admin/academic/niveaux/${id}`, values);
                setNiveauList(prev => prev.map(n => n.id_niveau === id ? { ...n, ...values } : n));
                toast.success('Niveau mis à jour');
            }}
            onDelete={(id) => setDeleteItem({ id, type: 'niveau' })}
            renderStatus={(val) => <Badge variant={val ? 'default' : 'secondary'}>{val ? 'Actif' : 'Inactif'}</Badge>}
          />
        </TabsContent>

        <TabsContent value="modules">
          <AcademicSection
            title="Modules"
            addLabel="Ajouter un module"
            idKey="id_module"
            columns={[
              { label: 'Code', key: 'code' },
              { label: 'Nom', key: 'nom' },
              { label: 'Filière', key: 'id_filiere' },
              { label: 'Niveau', key: 'id_niveau' },
              { label: 'Sem.', key: 'semestre' },
              { label: 'Statut', key: 'actif' },
            ]}
            data={filteredModules}
            filieres={filiereList}
            niveaux={niveauList}
            onAdd={async (values) => {
                const res = await api.post('/api/admin/academic/modules', values);
                setModuleList([res.data, ...moduleList]);
                toast.success('Module ajouté');
            }}
            onEdit={async (id, values) => {
                await api.put(`/api/admin/academic/modules/${id}`, values);
                setModuleList(prev => prev.map(m => m.id_module === id ? { ...m, ...values } : m));
                toast.success('Module mis à jour');
            }}
            onDelete={(id) => setDeleteItem({ id, type: 'module' })}
            renderCustomCell={(key, value) => {
                if (key === 'id_filiere') return filiereList.find(f => f.id_filiere === value)?.nom || '-';
                if (key === 'id_niveau') return niveauList.find(n => n.id_niveau === value)?.nom || '-';
                return value;
            }}
            renderStatus={(val) => <Badge variant={val ? 'default' : 'secondary'}>{val ? 'Actif' : 'Inactif'}</Badge>}
          />
        </TabsContent>

        <TabsContent value="annees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Années académiques</CardTitle>
              <AcademicDialog
                triggerLabel="Ajouter une année"
                defaultValues={{ libelle: '', date_debut: '', date_fin: '', actuelle: false }}
                onSubmit={async (values) => {
                    try {
                        const res = await api.post('/api/admin/academic/annees', values);
                        setAnneeList([res.data, ...anneeList]);
                        toast.success('Année ajoutée');
                    } catch(e) { toast.error('Erreur ajout'); }
                }}
                fields={[
                  { name: 'libelle', label: 'Libellé', type: 'text', required: true },
                  { name: 'date_debut', label: 'Début', type: 'date', required: true },
                  { name: 'date_fin', label: 'Fin', type: 'date', required: true },
                ]}
                showActive
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnees.map((annee) => (
                    <TableRow key={annee.id_annee}>
                      <TableCell className="font-medium">{annee.libelle}</TableCell>
                      <TableCell>{formatDate(annee.date_debut)} → {formatDate(annee.date_fin)}</TableCell>
                      <TableCell>
                        <Badge variant={annee.actuelle ? 'default' : 'secondary'}>
                          {annee.actuelle ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => toggleAcademicYear(annee.id_annee)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {annee.actuelle ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteItem({ id: annee.id_annee, type: 'annee' })}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODALE DE SUPPRESSION */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

// Helpers
const formatDate = (dateStr: string) => {
    if(!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
};

// --- COMPOSANTS INTERNES ---

interface AcademicSectionProps {
  title: string;
  addLabel: string;
  columns: Array<{ label: string; key: string }>;
  data: Array<any>;
  idKey: string; // Pour savoir quel est le nom de la colonne ID (ex: id_departement)
  onAdd: (values: any) => Promise<void>;
  onEdit: (id: any, values: any) => Promise<void>;
  onDelete: (id: any) => void;
  renderStatus?: (value: any) => React.ReactNode;
  renderCustomCell?: (key: string, value: any) => React.ReactNode;
  departements?: any[];
  filieres?: any[];
  niveaux?: any[];
}

function AcademicSection({ title, addLabel, columns, data, idKey, onAdd, onEdit, onDelete, renderStatus, renderCustomCell, departements, filieres, niveaux }: AcademicSectionProps) {
  const [editingId, setEditingId] = useState<any | null>(null);

  // Définition dynamique des champs du formulaire selon le titre
  const fields: any[] = [
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'nom', label: 'Nom', type: 'text', required: true },
  ];
  if(title !== 'Niveaux') fields.push({ name: 'description', label: 'Description', type: 'text' });
  
  if (title === 'Filières' && departements) fields.push({ name: 'id_departement', label: 'Département', type: 'select', options: departements.map(d => ({ label: d.nom, value: d.id_departement })) });
  if (title === 'Niveaux') fields.push({ name: 'ordre', label: 'Ordre', type: 'number', required: true });
  if (title === 'Modules') {
      if(filieres) fields.push({ name: 'id_filiere', label: 'Filière', type: 'select', options: filieres.map(f => ({ label: f.nom, value: f.id_filiere })) });
      if(niveaux) fields.push({ name: 'id_niveau', label: 'Niveau', type: 'select', options: niveaux.map(n => ({ label: n.nom, value: n.id_niveau })) });
      fields.push({ name: 'semestre', label: 'Semestre', type: 'number', required: true });
      fields.push({ name: 'credits', label: 'Crédits', type: 'number', required: true });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <AcademicDialog
          triggerLabel={addLabel}
          defaultValues={{ code: '', nom: '', description: '', actif: true }}
          onSubmit={onAdd}
          fields={fields}
          showActive
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center p-4 text-muted-foreground">Aucun élément.</TableCell></TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item[idKey]}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.key === 'actif' 
                        ? renderStatus?.(item[col.key]) 
                        : (renderCustomCell?.(col.key, item[col.key]) ?? item[col.key])}
                    </TableCell>
                  ))}
                  <TableCell className="text-right space-x-2">
                    <AcademicDialog
                      triggerLabel="Modifier"
                      defaultValues={item}
                      onSubmit={(v) => { onEdit(item[idKey], v); setEditingId(null); }}
                      fields={fields}
                      showActive
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

// Dialog Composant ( inchangé sauf typage props )
interface AcademicDialogProps {
  triggerLabel: string;
  defaultValues: Record<string, any>;
  fields: Array<{ name: string; label: string; type: 'text' | 'number' | 'date' | 'select'; required?: boolean; options?: { label: string; value: any }[] }>;
  onSubmit: (values: any) => Promise<void> | void;
  showActive?: boolean;
  openState?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function AcademicDialog({ triggerLabel, defaultValues, fields, onSubmit, showActive, openState, onOpenChange }: AcademicDialogProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const isControlled = openState !== undefined;
  const dialogOpen = isControlled ? openState : open;

  useEffect(() => { if (dialogOpen) setValues(defaultValues); }, [dialogOpen]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const handleSubmit = async () => {
    // Validation basique
    if (fields.some(f => f.required && !values[f.name])) {
        toast.error('Champs obligatoires manquants');
        return;
    }
    await onSubmit(values);
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
          <DialogDescription>Renseignez les informations.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label>{field.label}</Label>
              {field.type === 'select' ? (
                <Select value={String(values[field.name] || '')} onValueChange={(v) => setValues(prev => ({ ...prev, [field.name]: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input type={field.type} value={values[field.name] || ''} onChange={(e) => setValues(prev => ({ ...prev, [field.name]: e.target.value }))} />
              )}
            </div>
          ))}
          {showActive && (
            <div className="flex items-center justify-between border rounded p-3 md:col-span-2">
                <span className="font-medium">Actif</span>
                <Switch checked={!!(values.actif ?? values.actuelle)} onCheckedChange={(c) => setValues(prev => ({ ...prev, actif: c, actuelle: c }))} />
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}