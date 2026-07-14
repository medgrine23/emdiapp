/**
 * Palette de la marque MDI Build (bleu pétrole + bleu profond + jaune accent).
 * `accent` (jaune) s'utilise en FOND de bouton ; le texte dessus est `surAccent`
 * (bleu profond). Pour une action en TEXTE/icône sur fond clair, préférer
 * `primaireClair` (le jaune sur blanc serait illisible).
 */
export const couleurs = {
  primaire: '#0F5566', // bleu pétrole
  primaireClair: '#1C7C94', // pétrole clair (liens, icônes)
  primaireFonce: '#0B2A38', // bleu profond
  accent: '#F2C14E', // jaune
  surAccent: '#0B2A38', // texte/icône sur le jaune
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
    shadowColor: '#0B2A38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  carte: {
    shadowColor: '#0B2A38',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 3,
  },
  flottant: {
    shadowColor: '#0B2A38',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 7,
  },
};
