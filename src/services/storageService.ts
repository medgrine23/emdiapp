/**
 * Upload de fichiers vers Firebase Storage (médias du chat, pièces de la GED,
 * photos de rapport). Renvoie l'URL de téléchargement à stocker dans l'entité
 * (Message.mediaUrl, Document.url…).
 *
 * L'URI source provient d'un sélecteur/caméra natif (expo-image-picker,
 * expo-document-picker, expo-av) — à intégrer côté écran.
 */
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/firebase/config';

/** Chemin de stockage conventionnel : <collection>/<projetId?>/<fichier>. */
export function cheminStockage(dossier: string, nomFichier: string, projetId?: string | null): string {
  const base = projetId ? `${dossier}/${projetId}` : dossier;
  return `${base}/${Date.now()}-${nomFichier}`;
}

/**
 * Téléverse un fichier local (URI) vers Storage et renvoie son URL publique.
 * @param localUri  URI local du fichier (file://…)
 * @param chemin    chemin de destination (voir `cheminStockage`)
 */
export async function uploadFichier(localUri: string, chemin: string): Promise<string> {
  const reponse = await fetch(localUri);
  const blob = await reponse.blob();
  const objet = ref(storage, chemin);
  await uploadBytes(objet, blob);
  return getDownloadURL(objet);
}
