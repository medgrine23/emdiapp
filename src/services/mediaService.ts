/**
 * Sélection et persistance des médias (photos, vidéos, fichiers, notes vocales).
 *
 * S'appuie sur expo-image-picker / expo-document-picker / expo-av. En mode
 * Firebase, le média est téléversé vers Storage (URL renvoyée) ; en mode démo,
 * l'URI local est conservé tel quel pour l'affichage.
 */
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { firebaseConfigure } from '@/services/repository';
import { cheminStockage, uploadFichier } from '@/services/storageService';

export type TypeMedia = 'image' | 'video' | 'audio' | 'fichier';

export interface MediaLocal {
  uri: string;
  nom: string;
  tailleOctets: number;
  mimeType: string;
  type: TypeMedia;
  dureeSecondes?: number;
}

/** Choisit une image ou une vidéo dans la galerie. */
export async function choisirImage(): Promise<MediaLocal | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Accès à la galerie refusé.');
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.7 });
  if (res.canceled) return null;
  return depuisAsset(res.assets[0]);
}

/** Prend une photo avec la caméra. */
export async function prendrePhoto(): Promise<MediaLocal | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Accès à la caméra refusé.');
  const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (res.canceled) return null;
  return depuisAsset(res.assets[0]);
}

function depuisAsset(a: ImagePicker.ImagePickerAsset): MediaLocal {
  return {
    uri: a.uri,
    nom: a.fileName ?? `media-${Date.now()}`,
    tailleOctets: a.fileSize ?? 0,
    mimeType: a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    type: a.type === 'video' ? 'video' : 'image',
    dureeSecondes: a.duration ? Math.round(a.duration / 1000) : undefined,
  };
}

/** Choisit un fichier quelconque (PDF, Excel…). */
export async function choisirFichier(): Promise<MediaLocal | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (res.canceled) return null;
  const a = res.assets[0];
  return { uri: a.uri, nom: a.name, tailleOctets: a.size ?? 0, mimeType: a.mimeType ?? '', type: 'fichier' };
}

/**
 * Persiste le média : upload vers Storage si Firebase est configuré, sinon
 * renvoie l'URI local (mode démo).
 */
export async function persisterMedia(media: MediaLocal, dossier: string, projetId?: string | null): Promise<string> {
  if (!firebaseConfigure) return media.uri;
  return uploadFichier(media.uri, cheminStockage(dossier, media.nom, projetId ?? undefined));
}

/* ------------------------------------------------------------------ */
/* Enregistrement audio (notes vocales)                                */
/* ------------------------------------------------------------------ */

let enregistrement: Audio.Recording | null = null;
let debutMs = 0;

export async function demarrerEnregistrement(): Promise<void> {
  const perm = await Audio.requestPermissionsAsync();
  if (!perm.granted) throw new Error('Accès au micro refusé.');
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  enregistrement = recording;
  debutMs = Date.now();
}

export async function arreterEnregistrement(): Promise<MediaLocal | null> {
  if (!enregistrement) return null;
  await enregistrement.stopAndUnloadAsync();
  const uri = enregistrement.getURI();
  const dureeSecondes = Math.max(1, Math.round((Date.now() - debutMs) / 1000));
  enregistrement = null;
  if (!uri) return null;
  return { uri, nom: `note-vocale-${Date.now()}.m4a`, tailleOctets: 0, mimeType: 'audio/m4a', type: 'audio', dureeSecondes };
}

export const enregistrementEnCours = (): boolean => enregistrement !== null;
