import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  'student': 'Espace Étudiant',
  'supervisor': 'Espace Encadrant',
  'admin': 'Administration',
  'dashboard': 'Tableau de bord',
  'reports': 'Rapports',
  'report': 'Rapport',
  'create': 'Nouveau',
  'edit': 'Modifier',
  'profile': 'Profil',
  'notifications': 'Notifications',
  'settings': 'Paramètres',
  'help': 'Aide',
  'users': 'Utilisateurs',
  'academic': 'Académique',
  'reference': 'Référentiel',
  'plagiarism': 'Plagiat',
  'audit': 'Journal d\'audit',
  'versions': 'Versions',
  'comments': 'Commentaires',
  'grade': 'Note',
  'history': 'Historique',
  'validation': 'Validation',
  'evaluation': 'Évaluation',
  'upload-version': 'Nouvelle version',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [];
    let currentPath = '';

    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      
      // Skip ID-like segments in display but include in path
      const isId = part.match(/^[a-zA-Z]+-\d+$/) || part.length > 20;
      
      if (!isId) {
        const label = routeLabels[part] || part.charAt(0).toUpperCase() + part.slice(1);
        generatedItems.push({
          label,
          href: index < pathParts.length - 1 ? currentPath : undefined,
        });
      }
    });

    return generatedItems;
  })();

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      <Link
        to="/"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
