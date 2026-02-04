import { type RoleType } from '@/types';
import {
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  Bell,
  ClipboardList,
  History,
  HelpCircle,
  FileSearch,
  Upload,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: RoleType[];
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  // Student menu
  {
    title: 'Tableau de bord',
    href: '/student/dashboard',
    icon: LayoutDashboard,
    roles: ['ETUDIANT'],
  },
  {
    title: 'Mes Rapports',
    href: '/student/reports',
    icon: FileText,
    roles: ['ETUDIANT'],
  },
  {
    title: 'Nouveau Rapport',
    href: '/student/report/create',
    icon: Upload,
    roles: ['ETUDIANT'],
  },
  {
    title: 'Notifications',
    href: '/student/notifications',
    icon: Bell,
    roles: ['ETUDIANT'],
  },

  // Supervisor menu
  {
    title: 'Tableau de bord',
    href: '/supervisor/dashboard',
    icon: LayoutDashboard,
    roles: ['ENCADRANT'],
  },
  {
    title: 'Rapports à évaluer',
    href: '/supervisor/reports',
    icon: FileText,
    roles: ['ENCADRANT'],
  },
  {
    title: 'Historique',
    href: '/supervisor/history',
    icon: History,
    roles: ['ENCADRANT'],
  },
  {
    title: 'Notifications',
    href: '/supervisor/notifications',
    icon: Bell,
    roles: ['ENCADRANT'],
  },

  // Admin menu
  {
    title: 'Tableau de bord',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
  },
  {
    title: 'Utilisateurs',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    title: 'Académique',
    href: '/admin/academic',
    icon: GraduationCap,
    roles: ['ADMIN'],
  },
  {
    title: 'Rapports',
    href: '/admin/reports',
    icon: FileText,
    roles: ['ADMIN'],
  },
  {
    title: 'Plagiat',
    href: '/admin/plagiarism',
    icon: FileSearch,
    roles: ['ADMIN'],
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    roles: ['ADMIN'],
  },
  {
    title: "Journal d'audit",
    href: '/admin/audit',
    icon: ClipboardList,
    roles: ['ADMIN'],
  },
];

export const bottomNavItems: NavItem[] = [
  {
    title: 'Aide',
    href: '/help',
    icon: HelpCircle,
  },
];
