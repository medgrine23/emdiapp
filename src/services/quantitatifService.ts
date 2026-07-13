/**
 * Service du module Quantitatif / Métré (§3.10).
 *
 * Calcule, pour chaque pièce, la surface au sol, le volume et la surface des
 * murs AVEC déduction automatique des ouvertures (portes/fenêtres). Ces
 * métriques alimentent les lignes de devis (quantité pré-calculée).
 */
import { getRepository } from '@/services/repository';
import {
  CatalogueOuverture,
  ID,
  OuverturePiece,
  Piece,
  TypeMetrique,
} from '@/types/models';

export const COLLECTION_PIECES = 'pieces';
export const COLLECTION_CATALOGUE = 'cataloguesOuverture';

export const piecesRepo = getRepository<Piece>(COLLECTION_PIECES);
export const catalogueRepo = getRepository<CatalogueOuverture>(COLLECTION_CATALOGUE);

export const LIBELLE_METRIQUE: Record<TypeMetrique, string> = {
  surface_murs: 'Surface des murs',
  surface_sol: 'Surface au sol',
  volume: 'Volume',
};

export const UNITE_METRIQUE: Record<TypeMetrique, string> = {
  surface_murs: 'm²',
  surface_sol: 'm²',
  volume: 'm³',
};

export interface Metriques {
  surfaceSol: number;
  surfaceMurs: number;
  volume: number;
}

/** Dimensions minimales pour calculer les métriques d'une pièce. */
export interface DimensionsPiece {
  longueur: number;
  largeur: number;
  hauteur: number;
  ouvertures: OuverturePiece[];
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Calcule surface au sol, surface des murs (déductions incluses) et volume. */
export function calculerMetriques(p: DimensionsPiece): Metriques {
  const surfaceSol = p.longueur * p.largeur;
  const volume = surfaceSol * p.hauteur;
  const perimetre = 2 * (p.longueur + p.largeur);
  const murBrut = perimetre * p.hauteur;
  const deductions = p.ouvertures.reduce((s, o) => s + o.largeur * o.hauteur * o.quantite, 0);
  return {
    surfaceSol: arrondi(surfaceSol),
    surfaceMurs: arrondi(Math.max(0, murBrut - deductions)),
    volume: arrondi(volume),
  };
}

/** Valeur d'une métrique donnée pour une pièce. */
export function valeurMetrique(piece: Piece, metrique: TypeMetrique): number {
  if (metrique === 'surface_sol') return piece.surfaceSol;
  if (metrique === 'volume') return piece.volume;
  return piece.surfaceMurs;
}

/** Récupère une pièce (pour recalculer une quantité de devis liée). */
export function lirePiece(id: ID): Promise<Piece | null> {
  return piecesRepo.lire(id);
}
