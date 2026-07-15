/**
 * Thème de la marque MDI Build (bleu pétrole + bleu profond + jaune accent).
 *
 * Deux palettes — claire et sombre — sont définies. L'app choisit
 * automatiquement selon le thème du système (réglage clair/sombre du
 * téléphone) au démarrage. `accent` (jaune) s'utilise en FOND de bouton ;
 * le texte dessus est `surAccent`. Pour une action en TEXTE/icône, préférer
 * `primaireClair` (le jaune sur fond clair serait illisible).
 */
import { Appearance } from 'react-native';

export interface Palette {
  primaire: string;
  primaireClair: string;
  primaireFonce: string;
  accent: string;
  surAccent: string;
  fond: string;
  surface: string;
  surface2: string;
  texte: string;
  texteSecondaire: string;
  bordure: string;
  neutre: string;
  succes: string;
  danger: string;
  alerte: string;
}

export const paletteClaire: Palette = {
  primaire: '#0F5566',
  primaireClair: '#1C7C94',
  primaireFonce: '#0B2A38',
  accent: '#F2C14E',
  surAccent: '#0B2A38',
  fond: '#F1F4F6',
  surface: '#FFFFFF',
  surface2: '#F4F7F9',
  texte: '#0E2A36',
  texteSecondaire: '#5B7180',
  bordure: '#DCE4E9',
  neutre: '#64798A',
  succes: '#2E9E63',
  danger: '#C62828',
  alerte: '#E08A2B',
};

export const paletteSombre: Palette = {
  primaire: '#12667C', // pétrole (en-têtes)
  primaireClair: '#43A7C4', // liens / icônes sur fond sombre
  primaireFonce: '#0A1A24',
  accent: '#F2C14E', // jaune (identique)
  surAccent: '#0B2A38', // texte foncé sur le jaune
  fond: '#0B1720', // fond sombre (navy-noir)
  surface: '#13232E',
  surface2: '#1B2E3A',
  texte: '#E7EEF3',
  texteSecondaire: '#9FB2BF',
  bordure: '#263A48',
  neutre: '#7D92A2',
  succes: '#3FB37A',
  danger: '#EF5350',
  alerte: '#E8A54A',
};

/** Schéma actif (suit le système au démarrage ; 'automatic' dans app.json). */
export const schemaActif: 'light' | 'dark' = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

export const couleurs: Palette = schemaActif === 'dark' ? paletteSombre : paletteClaire;

export const espacements = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const rayons = {
  sm: 10,
  md: 16,
  lg: 22,
};

/** Ombres douces pour donner de la profondeur (rendu premium). */
export const ombres = {
  douce: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: schemaActif === 'dark' ? 0.25 : 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  carte: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: schemaActif === 'dark' ? 0.3 : 0.09,
    shadowRadius: 14,
    elevation: 3,
  },
  flottant: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: schemaActif === 'dark' ? 0.4 : 0.25,
    shadowRadius: 12,
    elevation: 7,
  },
};
