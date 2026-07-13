/**
 * Service du module Chat interne (§3.9).
 *
 * Messagerie : conversations (directes / groupe / liées à une tâche du Planning)
 * et messages. Les messages peuvent être du texte, un média (photo/vidéo/audio/
 * fichier — upload via Firebase Storage à intégrer) ou un PARTAGE MÉTIER : une
 * tâche, une ligne de devis, un rapport ou un document partagé dans la
 * conversation pour créer du contexte (exigence transverse §3.9).
 */
import { getRepository } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import {
  Conversation,
  EntitePartagee,
  ID,
  Message,
  PartageMetier,
  TypeConversation,
} from '@/types/models';

export const COLLECTION_CONVERSATIONS = 'conversations';
export const COLLECTION_MESSAGES = 'messages';

export const conversationsRepo = getRepository<Conversation>(COLLECTION_CONVERSATIONS);
export const messagesRepo = getRepository<Message>(COLLECTION_MESSAGES);

export const LIBELLE_TYPE_CONVERSATION: Record<TypeConversation, string> = {
  directe: 'Directe',
  groupe: 'Groupe',
  tache: 'Tâche',
};

export const LIBELLE_ENTITE_PARTAGEE: Record<EntitePartagee, string> = {
  tache_planning: 'Tâche',
  ligne_devis: 'Ligne de devis',
  rapport: 'Rapport',
  document: 'Document',
  projet: 'Projet',
};

/** Envoie un message texte et met à jour la date du dernier message. */
export async function envoyerTexte(
  conversation: Conversation,
  contenu: string,
  utilisateurId: ID = UTILISATEUR_COURANT_ID
): Promise<void> {
  const texte = contenu.trim();
  if (!texte) return;
  await messagesRepo.creer(
    { conversationId: conversation.id, projetId: conversation.projetId ?? null, auteurId: utilisateurId, type: 'texte', contenu: texte, envoyeLe: new Date().toISOString() },
    utilisateurId
  );
  await conversationsRepo.modifier(conversation.id, { dernierMessageLe: new Date().toISOString() }, utilisateurId);
}

/** Partage une entité métier dans la conversation (§3.9). */
export async function envoyerPartage(
  conversation: Conversation,
  partage: PartageMetier,
  utilisateurId: ID = UTILISATEUR_COURANT_ID
): Promise<void> {
  await messagesRepo.creer(
    { conversationId: conversation.id, projetId: conversation.projetId ?? null, auteurId: utilisateurId, type: 'partage', partage, envoyeLe: new Date().toISOString() },
    utilisateurId
  );
  await conversationsRepo.modifier(conversation.id, { dernierMessageLe: new Date().toISOString() }, utilisateurId);
}

/** Route de navigation vers l'entité partagée (best-effort). */
export function routePartage(p: PartageMetier): string | null {
  switch (p.entiteType) {
    case 'tache_planning':
      return `/(modules)/planning/${p.entiteId}`;
    case 'rapport':
      return `/(modules)/rapports/${p.entiteId}`;
    case 'document':
      return `/(modules)/documentation/${p.entiteId}`;
    case 'projet':
      return `/(modules)/projets/${p.entiteId}`;
    // ligne_devis : nécessite de résoudre le devis parent (voir écran conversation).
    default:
      return null;
  }
}
