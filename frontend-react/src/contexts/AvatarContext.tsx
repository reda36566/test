import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getGravatarUrl } from '@/lib/gravatar';

type AvatarType = 'upload' | 'email' | null;

type AvatarState = {
  url: string | null;
  type: AvatarType;
};

type AvatarContextValue = {
  avatarUrl: string | null;
  avatarType: AvatarType;
  emailAvatarFailed: boolean;
  setUploadedAvatar: (url: string) => void;
  setEmailAvatar: (email: string) => void;
  clearAvatar: () => void;
  handleAvatarError: () => void;
};

const AvatarContext = createContext<AvatarContextValue | undefined>(undefined);

const getStorageKey = (role?: string, userId?: number | string) => {
  if (!role || !userId) return null;
  return `avatar:${role}:${userId}`;
};

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<AvatarState>({ url: null, type: null });
  const [emailAvatarFailed, setEmailAvatarFailed] = useState(false);

  useEffect(() => {
    const key = getStorageKey(user?.role, user?.id_user);
    if (!key) {
      setAvatar({ url: null, type: null });
      return;
    }
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AvatarState;
        setAvatar(parsed);
        setEmailAvatarFailed(false);
        return;
      } catch (error) {
        localStorage.removeItem(key);
      }
    }
    const email = user?.utilisateur?.email || `${user?.login ?? ''}@ensa.ma`;
    const fallbackUrl = email ? getGravatarUrl(email) : '';
    if (fallbackUrl) {
      setAvatar({ url: fallbackUrl, type: 'email' });
      setEmailAvatarFailed(false);
    } else {
      setAvatar({ url: null, type: null });
    }
  }, [user?.id_user, user?.role]);

  const persistAvatar = (next: AvatarState | null) => {
    const key = getStorageKey(user?.role, user?.id_user);
    if (!key) return;
    if (!next) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(next));
  };

  const value = useMemo<AvatarContextValue>(
    () => ({
      avatarUrl: avatar.url,
      avatarType: avatar.type,
      emailAvatarFailed,
      setUploadedAvatar: (url: string) => {
        const next = { url, type: 'upload' as const };
        setAvatar(next);
        setEmailAvatarFailed(false);
        persistAvatar(next);
      },
      setEmailAvatar: (email: string) => {
        const url = getGravatarUrl(email);
        const next = { url, type: 'email' as const };
        setAvatar(next);
        setEmailAvatarFailed(false);
        persistAvatar(next);
      },
      clearAvatar: () => {
        setAvatar({ url: null, type: null });
        setEmailAvatarFailed(false);
        persistAvatar(null);
      },
      handleAvatarError: () => {
        if (avatar.type === 'email') {
          setAvatar({ url: null, type: null });
          setEmailAvatarFailed(true);
        }
      },
    }),
    [avatar, emailAvatarFailed]
  );

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
}

export function useAvatar() {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
}
