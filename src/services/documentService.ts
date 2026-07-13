/**
 * Service du module Documentation / GED (§3.7).
 *
 * Registre des documents (plans, fiches techniques, permis, photos…) et
 * mécanisme de LIAISON POLYMORPHE : un document peut être attaché à n'importe
 * quelle entité (tâche, ligne de devis, rapport, projet…) via `LiaisonDocument`.
 *
 * L'upload binaire vers Firebase Storage et le sélecteur natif de fichiers
 * seront branchés avec la stack Firebase ; ici on gère les métadonnées.
 */
import { getRepository } from '@/services/repository';
import { Document, EntiteBase, ID, LiaisonDocument, TypeDocument } from '@/types/models';

/** LiaisonDocument dotée du cycle de vie pour passer par le repository générique. */
export type LiaisonEntite = LiaisonDocument & EntiteBase;

export const COLLECTION_DOCUMENTS = 'documents';
export const COLLECTION_LIAISONS = 'liaisonsDocument';

export const documentsRepo = getRepository<Document>(COLLECTION_DOCUMENTS);
export const liaisonsRepo = getRepository<LiaisonEntite>(COLLECTION_LIAISONS);

export const LIBELLE_TYPE_DOCUMENT: Record<TypeDocument, string> = {
  plan: 'Plan',
  fiche_technique: 'Fiche technique',
  permis: 'Permis',
  photo: 'Photo',
  video: 'Vidéo',
  audio: 'Audio',
  contrat: 'Contrat',
  autre: 'Autre',
};

export const ICONE_TYPE_DOCUMENT: Record<TypeDocument, string> = {
  plan: '📐',
  fiche_technique: '📄',
  permis: '📜',
  photo: '🖼️',
  video: '🎬',
  audio: '🎧',
  contrat: '✍️',
  autre: '📎',
};

/** Formate une taille en octets de façon lisible. */
export function formaterTaille(octets: number): string {
  if (!octets) return '—';
  const u = ['o', 'Ko', 'Mo', 'Go'];
  let n = octets;
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

/** Attache un document à une entité (liaison polymorphe). */
export async function attacherDocument(
  documentId: ID,
  entiteType: string,
  entiteId: ID,
  projetId: ID | null,
  utilisateurId: ID
): Promise<void> {
  await liaisonsRepo.creer({ documentId, entiteType, entiteId, projetId }, utilisateurId);
}

/** Liste les liaisons d'une entité donnée. */
export async function liaisonsPourEntite(entiteType: string, entiteId: ID): Promise<LiaisonEntite[]> {
  return liaisonsRepo.lister({ filtre: { entiteType, entiteId } });
}
