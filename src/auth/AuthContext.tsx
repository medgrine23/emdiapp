/**
 * Contexte d'authentification.
 *
 * En mode démo (sans Firebase), l'application est ouverte (`demo = true`).
 * Quand Firebase est configuré, l'état de connexion est suivi via `observerAuth`
 * et l'accès est protégé par l'écran de connexion (voir app/_layout.tsx).
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';

import { authDisponible, observerAuth } from '@/services/authService';

interface EtatAuth {
  user: User | null;
  chargement: boolean;
  demo: boolean;
}

const AuthContext = createContext<EtatAuth>({ user: null, chargement: authDisponible, demo: !authDisponible });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(authDisponible);

  useEffect(() => {
    if (!authDisponible) {
      setChargement(false);
      return;
    }
    const off = observerAuth((u) => {
      setUser(u);
      setChargement(false);
    });
    return off;
  }, []);

  return <AuthContext.Provider value={{ user, chargement, demo: !authDisponible }}>{children}</AuthContext.Provider>;
}
