import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function StudentReportCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useAdminPlatformSettings();
  
  // États du formulaire
  const [titre, setTitre] = useState('');
  const [typeRapport, setTypeRapport] = useState('1'); 
  const [selectedEncadrant, setSelectedEncadrant] = useState('');
  
  // ✅ NOUVEAUX ÉTATS
  const [selectedEntreprise, setSelectedEntreprise] = useState('');
  const [selectedAnnee, setSelectedAnnee] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState('');
  
  // États de données (Listes déroulantes)
  const [encadrants, setEncadrants] = useState<any[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]); // ✅
  const [annees, setAnnees] = useState<any[]>([]); // ✅
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // 1. CHARGER TOUTES LES LISTES (Profs, Entreprises, Années)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProfs, resEnt, resAnnees] = await Promise.all([
            api.get('/api/encadrants'),
            api.get('/api/entreprises'),
            api.get('/api/admin/academic/annees') // Utilise la route existante
        ]);

        setEncadrants(resProfs.data);
        setEntreprises(resEnt.data);
        setAnnees(resAnnees.data);

        // ✅ Pré-sélectionner l'année en cours (si trouvée)
        const anneeEnCours = resAnnees.data.find((a: any) => a.actuelle === 1);
        if (anneeEnCours) setSelectedAnnee(anneeEnCours.id_annee.toString());

      } catch (error) {
        console.error("Erreur chargement données", error);
        toast.error("Impossible de charger les listes (Profs/Entreprises)");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedFormats = settings.submissionRules.allowedFormats;
      const allowedExtensions = Object.entries(allowedFormats)
        .filter(([, enabled]) => enabled)
        .map(([ext]) => `.${ext}`);

      if (allowedExtensions.length > 0 && !allowedExtensions.some((ext) => selectedFile.name.toLowerCase().endsWith(ext))) {
        toast.error('Format de fichier non autorisé.');
        return;
      }
      const maxSizeMb = settings.submissionRules.maxFileSizeMb;
      if (selectedFile.size > maxSizeMb * 1024 * 1024) {
        toast.error(`Le fichier dépasse la taille maximale de ${maxSizeMb} MB.`);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    // ✅ Validation complète
    if (!titre || !file || !selectedEncadrant || !selectedAnnee) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (settings.submissionRules.requireCompany && !selectedEntreprise) {
      toast.error('Veuillez sélectionner une entreprise.');
      return;
    }
    if (settings.submissionRules.requireSummary && !summary.trim()) {
      toast.error('Le résumé est obligatoire.');
      return;
    }
    if (settings.submissionRules.requireKeywords && !keywords.trim()) {
      toast.error('Les mots-clés sont obligatoires.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('titre', titre);
      formData.append('id_type', typeRapport);
      formData.append('id_encadrant', selectedEncadrant);
      
      // ✅ Envoi des vraies valeurs sélectionnées
      formData.append('id_annee', selectedAnnee);
      if (selectedEntreprise) {
        formData.append('id_entreprise', selectedEntreprise);
      }
      
      const studentId = (user as any)?.id_specifique || (user as any)?.id_etudiant || 1;
      formData.append('id_etudiant', studentId);
      formData.append('rapport', file);

      await api.post('/api/rapports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Rapport déposé avec succès !');
      navigate('/student/dashboard');

    } catch (error: any) {
      console.error("Erreur upload:", error);
      toast.error(error.response?.data?.error || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>

      <PageHeader 
        title="Nouveau Rapport" 
        description="Remplissez ce formulaire pour déposer votre PFE/PFA." 
      />

      <div className="max-w-2xl mx-auto mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Détails du dépôt</CardTitle>
            <CardDescription>Tous les champs marqués d'un * sont obligatoires.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label>Titre du sujet *</Label>
              <Input 
                placeholder="Ex: Mise en place d'une architecture Cloud..." 
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de rapport *</Label>
                <Select value={typeRapport} onValueChange={setTypeRapport}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">PFE</SelectItem>
                    <SelectItem value="2">PFA</SelectItem>
                    <SelectItem value="3">Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Année Académique *</Label>
                <Select value={selectedAnnee} onValueChange={setSelectedAnnee}>
                  <SelectTrigger><SelectValue placeholder="Année..." /></SelectTrigger>
                  <SelectContent>
  {annees.map((a: any) => {
    // 1. On extrait l'année de début (ex: 2024 depuis "2024-12-10")
    const start = new Date(a.date_debut).getFullYear();
    // 2. On extrait l'année de fin (ex: 2026 depuis "2026-12-06")
    const end = new Date(a.date_fin).getFullYear();
    
    // 3. On affiche le format "YYYY - YYYY"
    return (
      <SelectItem key={a.id_annee} value={a.id_annee.toString()}>
        {start} - {end}
      </SelectItem>
    );
  })}
</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Résumé {settings.submissionRules.requireSummary ? '*' : '(optionnel)'}</Label>
              <Input
                placeholder="Résumé court du rapport"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mots-clés {settings.submissionRules.requireKeywords ? '*' : '(optionnel)'}</Label>
              <Input
                placeholder="Ex: IA, Web, Optimisation"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* ✅ SÉLECTEUR ENTREPRISE AJOUTÉ */}
               <div className="space-y-2">
                <Label>Entreprise d'accueil {settings.submissionRules.requireCompany ? '*' : '(optionnel)'}</Label>
                <Select value={selectedEntreprise} onValueChange={setSelectedEntreprise}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Chargement..." : "Choisir l'entreprise"} />
                  </SelectTrigger>
                  <SelectContent>
                    {entreprises.map((ent: any) => (
                      <SelectItem key={ent.id_entreprise} value={ent.id_entreprise.toString()}>
                        {ent.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Encadrant Pédagogique *</Label>
                <Select value={selectedEncadrant} onValueChange={setSelectedEncadrant}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Chargement..." : "Sélectionner un prof"} />
                  </SelectTrigger>
                  <SelectContent>
                    {encadrants.map((prof: any) => (
                      <SelectItem key={prof.id_encadrant} value={prof.id_encadrant.toString()}>
                        {prof.nom.toUpperCase()} {prof.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ZONE DE DÉPÔT FICHIER */}
            <div className="space-y-2 pt-4">
              <Label>Fichier *</Label>
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${file ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                        <>
                            <FileText className="w-8 h-8 mb-2 text-green-600" />
                            <p className="text-sm font-semibold text-green-700">{file.name}</p>
                            <p className="text-xs text-green-600">Prêt à envoyer</p>
                        </>
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour déposer</span></p>
                            <p className="text-xs text-gray-500">PDF uniquement</p>
                        </>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept={Object.entries(settings.submissionRules.allowedFormats)
                      .filter(([, enabled]) => enabled)
                      .map(([ext]) => `.${ext}`)
                      .join(',') || '.pdf'}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Formats autorisés : {Object.entries(settings.submissionRules.allowedFormats)
                  .filter(([, enabled]) => enabled)
                  .map(([ext]) => ext.toUpperCase())
                  .join(', ') || 'PDF'}
                {' · '}Taille max {settings.submissionRules.maxFileSizeMb} MB.
              </p>
            </div>

            <Button onClick={handleSubmit} className="w-full mt-6" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              {loading ? "Envoi en cours..." : "Créer et Envoyer"}
            </Button>

          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
