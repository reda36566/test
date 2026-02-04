import { useEffect, useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Breadcrumbs } from './Breadcrumbs';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

export function AppLayout({ children, showBreadcrumbs = true }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const { settings } = useAdminPlatformSettings();
  const { user } = useAuth();
  const [logoutCountdown, setLogoutCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!user || settings.security.autoLogoutWarningMinutes <= 0) {
      setLogoutCountdown(null);
      return;
    }
    setLogoutCountdown(settings.security.autoLogoutWarningMinutes * 60);
    const interval = setInterval(() => {
      setLogoutCountdown((prev) => {
        if (prev === null) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.security.autoLogoutWarningMinutes, user]);

  return (
    <div className={`min-h-screen bg-background w-full ${settings.general.reduceMotion ? 'reduce-motion' : ''}`}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className={`flex min-h-screen flex-col ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {settings.general.maintenanceMode && (
          <div className="bg-warning/10 text-warning-foreground border-b border-warning/20 px-4 py-2 text-sm">
            <div className="mx-auto max-w-7xl">
              <strong className="mr-2">Mode maintenance</strong>
              {settings.general.bannerMessage}
            </div>
          </div>
        )}
        {logoutCountdown !== null && (
          <div className="bg-muted/40 text-muted-foreground border-b px-4 py-2 text-xs">
            <div className="mx-auto max-w-7xl">
              Avertissement : déconnexion automatique simulée dans {Math.floor(logoutCountdown / 60)}:
              {String(logoutCountdown % 60).padStart(2, '0')}.
            </div>
          </div>
        )}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
            {showBreadcrumbs && <Breadcrumbs />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
