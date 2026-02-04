import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPlatformSettings } from '@/contexts/AdminPlatformSettingsContext';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { bottomNavItems, navItems } from '@/config/navigation';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { user } = useAuth();
  const { settings } = useAdminPlatformSettings();
  const location = useLocation();

  if (!user) return null;

  const filteredNavItems = navItems
    .filter(item => !item.roles || item.roles.includes(user.role))
    .filter((item) => {
      if (user.role === 'ENCADRANT' && item.href === '/supervisor/history') {
        return settings.roleUi.supervisor.showHistoryPage;
      }
      if (user.role === 'ETUDIANT' && item.href === '/student/report/create') {
        return settings.roleUi.student.showNewDepositButton;
      }
      return true;
    });

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
          collapsed ? 'w-20' : 'w-72',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/" className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              EN
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-sm">E-RAPPORTS</span>
                <span className="text-xs text-sidebar-foreground/70">Gestion des rapports</span>
              </div>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onToggleCollapse}
            >
              {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
              <span className="sr-only">{collapsed ? 'Étendre le menu' : 'Réduire le menu'}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <TooltipProvider>
              <nav className={cn('space-y-1', collapsed ? 'px-2' : 'px-3')}>
                {filteredNavItems.map((item) => {
                  const link = (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        collapsed && 'justify-center px-2',
                        isActive(item.href)
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  );

                  if (!collapsed) {
                    return link;
                  }

                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </nav>
            </TooltipProvider>
          </ScrollArea>

          <div className="flex-grow basis-0 max-h-24" aria-hidden="true" />

          {/* Bottom navigation */}
          <div className={cn('border-t border-sidebar-border space-y-1', collapsed ? 'p-2' : 'p-3')}>
            {bottomNavItems.map((item) => {
              const link = (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive(item.href)
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );

              if (!collapsed) {
                return link;
              }

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
