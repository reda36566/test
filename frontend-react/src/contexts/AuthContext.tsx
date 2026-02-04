import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// On définit une structure "flexible" pour satisfaire tout le monde
export interface AuthUser {
  id_user: number;
  login: string;
  role: 'ADMIN' | 'ENCADRANT' | 'ETUDIANT';
  id_specifique?: number;
  // Ces objets sont nécessaires pour éviter l'écran blanc dans AppLayout
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  encadrant?: { id: number };
  etudiant?: { id: number };
}

interface AuthContextType {
  user: AuthUser | null;
  login: (userData: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'ensa_pfe_session_v4'; // Nouvelle clé pour reset

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🛠️ LE REPARATEUR DE DONNÉES
  const sanitizeUser = (input: any): AuthUser | null => {
    if (!input) return null;

    // 1. Déballage (si l'objet est dans 'user')
    let rawData = input.user || input;

    // 2. Détection du Rôle
    let finalRole = rawData.role;
    if (!finalRole || typeof finalRole === 'number') {
        if (rawData.login === 'prof' || rawData.id_role === 2) finalRole = 'ENCADRANT';
        else if (rawData.login === 'ghali' || rawData.id_role === 3) finalRole = 'ETUDIANT';
        else finalRole = 'ADMIN';
    }

    // 3. Détection de l'ID Spécifique
    let finalIdSpec = rawData.id_specifique;
    if (!finalIdSpec) {
        if (finalRole === 'ENCADRANT') finalIdSpec = rawData.id_encadrant || 1;
        if (finalRole === 'ETUDIANT') finalIdSpec = rawData.id_etudiant || 1;
    }

    // 4. RECONSTRUCTION (Pour éviter l'écran blanc !)
    // On recrée les objets imbriqués que AppLayout attend
    const finalUser: any = {
        id_user: rawData.id_user || rawData.id_utilisateur || 0,
        login: rawData.login || "Utilisateur",
        role: finalRole,
        id_specifique: finalIdSpec,
        // On simule l'objet 'utilisateur' pour l'affichage du nom
        utilisateur: {
            id: rawData.id_user || 0,
            nom: (rawData.login || "User").toUpperCase(),
            prenom: "",
            email: rawData.login + "@ensa.ma"
        }
    };

    // Si c'est un prof, on ajoute l'objet 'encadrant'
    if (finalRole === 'ENCADRANT') {
        finalUser.encadrant = { id: finalIdSpec };
    }
    // Si c'est un étudiant, on ajoute l'objet 'etudiant'
    if (finalRole === 'ETUDIANT') {
        finalUser.etudiant = { id: finalIdSpec };
    }

    console.log("✅ User reconstruit pour le Dashboard :", finalUser);
    return finalUser;
  };

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const clean = sanitizeUser(JSON.parse(stored));
        setUser(clean);
      } catch (e) { localStorage.removeItem(AUTH_STORAGE_KEY); }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: any) => {
    const clean = sanitizeUser(userData);
    if (clean) {
        setUser(clean);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clean));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = '/login';
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}