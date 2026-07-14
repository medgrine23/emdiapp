import { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { documentsRepo, LIBELLE_TYPE_DOCUMENT } from '@/services/documentService';
import { choisirFichier, choisirImage, MediaLocal, persisterMedia } from '@/services/mediaService';
import { projetsRepo } from '@/services/projetService';
import { SansMeta } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Document, TypeDocument } from '@/types/models';

const TYPES = Object.keys(LIBELLE_TYPE_DOCUMENT) as TypeDocument[];
const u = UTILISATEUR_COURANT_ID;

export default function FormulaireDocument() {
  const { id, projetId: projetParam } = useLocalSearchParams<{ id?: string; projetId?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);

  const [nom, setNom] = useState('');
  const [type, setType] = useState<TypeDocument>('plan');
  const [projetId, setProjetId] = useState<string | null>(projetParam ?? null);
  const [url, setUrl] = useState('');
  const [tailleKo, setTailleKo] = useState('');
  const [media, setMedia] = useState<MediaLocal | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const selectionner = async (selecteur: () => Promise<MediaLocal | null>) => {
    try {
      const m = await selecteur();
      if (!m) return;
      setMedia(m);
      if (!nom.trim()) setNom(m.nom);
      setTailleKo(m.tailleOctets ? String(Math.round(m.tailleOctets / 1024)) : '');
      if (m.type === 'image') setType('photo');
      else if (m.type === 'video') setType('video');
    } catch (e) {
      setErreur((e as Error).message);
    }
  };

  useEffect(() => {
    if (!id) return;
    documentsRepo.lire(id).then((d) => {
      if (!d) return;
      setNom(d.nom);
      setType(d.type);
      setProjetId(d.projetId ?? null);
      setUrl(d.url);
      setTailleKo(d.tailleOctets ? String(Math.round(d.tailleOctets / 1024)) : '');
    });
  }, [id]);

  const enregistrer = async () => {
    if (!nom.trim()) return setErreur('Le nom du document est obligatoire.');
    let urlFinale = url.trim();
    let mimeType = media?.mimeType ?? '';
    if (media) {
      try {
        urlFinale = await persisterMedia(media, 'documents', projetId);
      } catch (e) {
        return setErreur((e as Error).message);
      }
    }
    const data: SansMeta<Document> = {
      nom: nom.trim(),
      type,
      projetId: projetId ?? null,
      url: urlFinale,
      mimeType,
      tailleOctets: (Number(tailleKo.replace(/\s/g, '')) || 0) * 1024,
      uploadePar: u,
    };
    if (edition && id) {
      await documentsRepo.modifier(id, data, u);
    } else {
      await documentsRepo.creer(data, u);
    }
    router.back();
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier le document' : 'Nouveau document' }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Text style={styles.info}>
        Choisissez un fichier ou une photo. En mode Firebase, il est téléversé vers Storage ;
        en mode démo, seul l'aperçu local est conservé.
      </Text>

      <View style={styles.picker}>
        <Pressable style={styles.pickerBtn} onPress={() => selectionner(choisirFichier)}>
          <Text style={styles.pickerTexte}>📎 Fichier</Text>
        </Pressable>
        <Pressable style={styles.pickerBtn} onPress={() => selectionner(choisirImage)}>
          <Text style={styles.pickerTexte}>🖼️ Photo / Vidéo</Text>
        </Pressable>
      </View>
      {media ? <Text style={styles.mediaChoisi}>Sélectionné : {media.nom}</Text> : null}

      <Label texte="Nom *" />
      <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="Ex : Plan de masse RDC" />

      <Label texte="Type" />
      <View style={styles.chips}>
        {TYPES.map((t) => (
          <Chip key={t} actif={type === t} label={LIBELLE_TYPE_DOCUMENT[t]} onPress={() => setType(t)} />
        ))}
      </View>

      <Label texte="Projet (optionnel — sinon document global)" />
      <View style={styles.chips}>
        <Chip actif={projetId === null} label="Global" onPress={() => setProjetId(null)} />
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
      </View>

      <Label texte="URL / référence de stockage (optionnel)" />
      <TextInput style={styles.champ} value={url} onChangeText={setUrl} placeholder="https://…" autoCapitalize="none" />

      <Label texte="Taille (Ko)" />
      <TextInput style={styles.champ} value={tailleKo} onChangeText={setTailleKo} keyboardType="numeric" />

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>{edition ? 'Enregistrer' : 'Ajouter le document'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Label({ texte }: { texte: string }) {
  return <Text style={styles.label}>{texte}</Text>;
}
function Chip({ label, actif, onPress }: { label: string; actif: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, actif && styles.chipActif]} onPress={onPress}>
      <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  erreur: { color: couleurs.danger, backgroundColor: `${couleurs.danger}10`, padding: espacements.sm, borderRadius: rayons.sm, marginBottom: espacements.sm },
  info: { fontSize: 12, fontStyle: 'italic', color: couleurs.texteSecondaire, marginBottom: espacements.sm },
  picker: { flexDirection: 'row', gap: espacements.sm },
  pickerBtn: { flex: 1, borderWidth: 1.5, borderColor: couleurs.primaireClair, borderRadius: rayons.sm, padding: espacements.sm, alignItems: 'center' },
  pickerTexte: { color: couleurs.primaireClair, fontWeight: '700' },
  mediaChoisi: { fontSize: 13, color: couleurs.succes, marginTop: espacements.sm, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: couleurs.surAccent, fontWeight: '700', fontSize: 16 },
});
