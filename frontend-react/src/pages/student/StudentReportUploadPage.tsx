import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

export default function StudentReportUploadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rapport, setRapport] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. On charge les infos du rapport pour afficher son titre
  useEffect(() => {
    const fetchRapport = async () => {
      try {
        // ✅ CORRECTION : Ajout de /api
        const res = await api.get(`/api/rapports/${id}`);
        setRapport(res.data);
      } catch (error) {
        console.error("Erreur chargement rapport", error);
        toast.error("Impossible de charger le rapport");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRapport();
  }, [id]);

  // Gestion du fichier sélectionné
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    // 'rapport' doit correspondre au nom dans upload.single('rapport') côté serveur
    formData.append('rapport', file);

    try {
      // ✅ CORRECTION : Ajout de /api
      // Appel à la nouvelle route créée (Route #9)
      await api.post(`/api/rapports/${id}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Nouvelle version envoyée avec succès !');
      // On retourne sur la page de détails
      navigate(`/student/report/${id}`);
      
    } catch (error) {
      console.error("Erreur upload:", error);
      toast.error("Erreur lors de l'envoi du fichier.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!rapport) return <div className="text-center p-10">Rapport introuvable</div>;

  return (
    <AppLayout>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
      </Button>

      <PageHeader 
        title="Nouvelle Version" 
        description={`Ajouter une mise à jour pour : ${rapport.titre}`} 
      />

      <div className="max-w-xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Déposer un fichier
            </CardTitle>
            <CardDescription>
                Cela créera une nouvelle version de votre rapport et notifiera votre encadrant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <Label htmlFor="file-upload">Fichier PDF du rapport</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${file ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                        <>
                            <FileText className="w-8 h-8 mb-2 text-primary" />
                            <p className="text-sm font-semibold text-primary">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                    ) : (
                        <>
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Cliquez pour upload</span></p>
                            <p className="text-xs text-gray-500">PDF uniquement</p>
                        </>
                    )}
                  </div>
                  <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={submitting || !file}>
              {submitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours...
                </>
              ) : (
                <>
                    <Upload className="mr-2 h-4 w-4" /> Envoyer la version
                </>
              )}
            </Button>

          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}