/**
 * Préférences locales de l'appareil (stockage synchrone).
 *
 * Contrairement aux données métier (mémoire/Firestore), ces réglages doivent
 * être lisibles DÈS le démarrage, de façon synchrone, avant même le premier
 * rendu — le thème en dépend. On s'appuie donc sur l'API synchrone de
 * SQLite (`openDatabaseSync`) sur Android/iOS, et sur `localStorage` sur le
 * web. Tout est protégé par des try/catch : en cas d'indisponibilité (ex.
 * prérendu web en Node), on retombe silencieusement sur les valeurs par
 * défaut sans faire planter l'application.
 */
import { Platform } from 'react-native';

export type ChoixTheme = 'auto' | 'clair' | 'sombre';

const CLE_THEME = 'theme';

/** Accès bas niveau : renvoie une valeur ou null, sans jamais lever. */
function lire(cle: string): string | null {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem('mdi.' + cle);
    }
    return baseSqlite().lire(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string): void {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem('mdi.' + cle, valeur);
      return;
    }
    baseSqlite().ecrire(cle, valeur);
  } catch {
    // silencieux : la préférence n'est pas persistée, sans blocage.
  }
}

/** Base SQLite ouverte paresseusement (une seule fois), API synchrone. */
let _base: { lire: (c: string) => string | null; ecrire: (c: string, v: string) => void } | null = null;
function baseSqlite() {
  if (_base) return _base;
  // Require paresseux pour éviter de charger le module natif sur web/prérendu.
  const SQLite = require('expo-sqlite') as typeof import('expo-sqlite');
  const db = SQLite.openDatabaseSync('mdi_prefs.db');
  db.execSync('CREATE TABLE IF NOT EXISTS prefs (cle TEXT PRIMARY KEY NOT NULL, valeur TEXT);');
  _base = {
    lire: (c) => {
      const row = db.getFirstSync<{ valeur: string }>('SELECT valeur FROM prefs WHERE cle = ?', c);
      return row ? row.valeur : null;
    },
    ecrire: (c, v) => {
      db.runSync('INSERT OR REPLACE INTO prefs (cle, valeur) VALUES (?, ?)', c, v);
    },
  };
  return _base;
}

const CHOIX_VALIDES: ChoixTheme[] = ['auto', 'clair', 'sombre'];

/** Choix de thème enregistré (défaut : 'auto' = suit le système). Synchrone. */
export function getChoixTheme(): ChoixTheme {
  const v = lire(CLE_THEME) as ChoixTheme | null;
  return v && CHOIX_VALIDES.includes(v) ? v : 'auto';
}

/** Enregistre le choix de thème (appliqué au prochain démarrage). */
export function setChoixTheme(choix: ChoixTheme): void {
  ecrire(CLE_THEME, choix);
}
