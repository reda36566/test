import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AdminPlatformSettings = {
  general: {
    platformName: string;
    tagline: string;
    maintenanceMode: boolean;
    bannerMessage: string;
    reduceMotion: boolean;
  };
  roleUi: {
    student: {
      showNewDepositButton: boolean;
      showTimelineSection: boolean;
      tableColumns: {
        entreprise: boolean;
        module: boolean;
        encadrant: boolean;
        dateDepot: boolean;
      };
    };
    supervisor: {
      showStudentsPage: boolean;
      showArchivesPage: boolean;
      showHistoryPage: boolean;
    };
    admin: {
      showActivityIcon: boolean;
      showExportButtons: boolean;
    };
  };
  submissionRules: {
    maxFileSizeMb: number;
    allowedFormats: {
      pdf: boolean;
      doc: boolean;
      docx: boolean;
    };
    requireSummary: boolean;
    requireKeywords: boolean;
    requireCompany: boolean;
  };
  plagiarism: {
    alertThreshold: number;
    showColumnSupervisor: boolean;
    hideFromStudent: boolean;
    riskLabels: {
      low: string;
      medium: string;
      high: string;
    };
  };
  notifications: {
    enableSound: boolean;
    enableToast: boolean;
    groupSimilar: boolean;
    dropdownCount: 5 | 8 | 10;
  };
  security: {
    autoLogoutWarningMinutes: number;
    maskEmail: boolean;
  };
};

const STORAGE_KEY = 'admin_platform_settings';

const defaultSettings: AdminPlatformSettings = {
  general: {
    platformName: 'E-RAPPORTS',
    tagline: 'Plateforme académique de suivi',
    maintenanceMode: false,
    bannerMessage: 'Maintenance en cours. Certaines fonctionnalités peuvent être limitées.',
    reduceMotion: false,
  },
  roleUi: {
    student: {
      showNewDepositButton: true,
      showTimelineSection: true,
      tableColumns: {
        entreprise: true,
        module: true,
        encadrant: true,
        dateDepot: true,
      },
    },
    supervisor: {
      showStudentsPage: true,
      showArchivesPage: true,
      showHistoryPage: true,
    },
    admin: {
      showActivityIcon: true,
      showExportButtons: true,
    },
  },
  submissionRules: {
    maxFileSizeMb: 20,
    allowedFormats: {
      pdf: true,
      doc: false,
      docx: false,
    },
    requireSummary: false,
    requireKeywords: false,
    requireCompany: true,
  },
  plagiarism: {
    alertThreshold: 30,
    showColumnSupervisor: true,
    hideFromStudent: false,
    riskLabels: {
      low: 'Faible',
      medium: 'Moyen',
      high: 'Élevé',
    },
  },
  notifications: {
    enableSound: false,
    enableToast: true,
    groupSimilar: false,
    dropdownCount: 8,
  },
  security: {
    autoLogoutWarningMinutes: 0,
    maskEmail: false,
  },
};

type AdminPlatformSettingsContextValue = {
  settings: AdminPlatformSettings;
  setSettings: (settings: AdminPlatformSettings) => void;
  resetSettings: () => void;
};

const AdminPlatformSettingsContext = createContext<AdminPlatformSettingsContextValue | undefined>(undefined);

export function AdminPlatformSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AdminPlatformSettings>(defaultSettings);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AdminPlatformSettings;
        setSettingsState({
          ...defaultSettings,
          ...parsed,
          general: { ...defaultSettings.general, ...parsed.general },
          roleUi: {
            ...defaultSettings.roleUi,
            ...parsed.roleUi,
            student: { ...defaultSettings.roleUi.student, ...parsed.roleUi?.student },
            supervisor: { ...defaultSettings.roleUi.supervisor, ...parsed.roleUi?.supervisor },
            admin: { ...defaultSettings.roleUi.admin, ...parsed.roleUi?.admin },
          },
          submissionRules: {
            ...defaultSettings.submissionRules,
            ...parsed.submissionRules,
            allowedFormats: {
              ...defaultSettings.submissionRules.allowedFormats,
              ...parsed.submissionRules?.allowedFormats,
            },
          },
          plagiarism: {
            ...defaultSettings.plagiarism,
            ...parsed.plagiarism,
            riskLabels: { ...defaultSettings.plagiarism.riskLabels, ...parsed.plagiarism?.riskLabels },
          },
          notifications: { ...defaultSettings.notifications, ...parsed.notifications },
          security: { ...defaultSettings.security, ...parsed.security },
        });
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      setSettings: setSettingsState,
      resetSettings: () => setSettingsState(defaultSettings),
    }),
    [settings]
  );

  return (
    <AdminPlatformSettingsContext.Provider value={value}>
      {children}
    </AdminPlatformSettingsContext.Provider>
  );
}

export function useAdminPlatformSettings() {
  const context = useContext(AdminPlatformSettingsContext);
  if (!context) {
    throw new Error('useAdminPlatformSettings must be used within an AdminPlatformSettingsProvider');
  }
  return context;
}

export const maskEmailValue = (email: string) => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const maskedName = name.length <= 2 ? `${name[0]}*` : `${name.slice(0, 2)}***`;
  return `${maskedName}@${domain}`;
};
