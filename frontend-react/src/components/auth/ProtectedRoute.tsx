import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleType } from '@/types';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { Loader2 } from 'lucide-react'; // Pour le joli rond de chargement

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: RoleType[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  // On récupère isLoading ici !
  const { isAuthenticated, hasRole, isLoading } = useAuth();
  const location = useLocation();

  // 1. SI ÇA CHARGE ENCORE : On affiche un écran d'attente
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Si le chargement est fini et qu'on n'est pas connecté -> Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Si on est connecté mais qu'on n'a pas le bon rôle -> 403
  if (allowedRoles && !hasRole(allowedRoles)) {
    return <ForbiddenPage />;
  }

  // 4. Tout est bon -> On affiche la page
  return <>{children}</>;
}