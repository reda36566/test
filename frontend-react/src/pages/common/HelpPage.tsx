import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  HelpCircle,
  ExternalLink,
  FileText,
  CheckCircle,
  AlertTriangle,
  Upload,
  Bell,
  UserCheck,
  GraduationCap,
  Users,
  BookOpen,
  FileSearch,
} from 'lucide-react';
import { Link } from 'react-router-dom'; // ✅ Import pour la navigation interne

const faqs = [
  { q: 'Comment soumettre un rapport ?', a: 'Allez dans votre tableau de bord, cliquez sur "Nouveau rapport", remplissez les informations, uploadez votre fichier PDF puis cliquez sur "Soumettre".' },
  { q: 'Puis-je modifier un rapport soumis ?', a: 'Une fois soumis (Statut Bleu), vous ne pouvez plus le modifier directement. Cependant, si votre encadrant demande des corrections (Statut Jaune), vous pourrez uploader une nouvelle version.' },
  { q: 'Comment contacter mon encadrant ?', a: 'Les coordonnées de votre encadrant sont visibles sur la page de détail de chaque rapport.' },
  { q: 'Quand ma note sera-t-elle disponible ?', a: 'La note est publiée dès que votre encadrant valide le rapport (Statut Vert). Vous recevrez également une notification.' },
];

export default function HelpPage() {
  return (
    <AppLayout>
      <PageHeader 
        title="Aide & Support" 
        description="FAQ et assistance technique pour la gestion de vos rapports." 
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Questions fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ Utilisation de mailto: pour ouvrir le client mail */}
              <a 
                href="mailto:support@ensa.ma" 
                className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>support@ensa.ma</span>
              </a>
              
              {/* ✅ Utilisation de tel: pour les appels */}
              <a 
                href="tel:+212500000000" 
                className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
              >
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>+212 5XX XX XX XX</span>
              </a>

              <hr className="my-4 border-primary/10" />

              <Button className="w-full" asChild>
                <Link to="/tickets/create">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ouvrir un ticket
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground text-center">
                Disponibilité du support : <br />
                Lundi - Vendredi (09:00 - 18:00)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
