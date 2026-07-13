import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ModalPartage } from '@/components/ModalPartage';
import {
  conversationsRepo,
  envoyerMedia,
  envoyerPartage,
  envoyerTexte,
  LIBELLE_ENTITE_PARTAGEE,
  messagesRepo,
  routePartage,
} from '@/services/chatService';
import {
  arreterEnregistrement,
  choisirFichier,
  choisirImage,
  demarrerEnregistrement,
  prendrePhoto,
} from '@/services/mediaService';
import { lignesDevisRepo } from '@/services/devisService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { useCollection, useDocument } from '@/hooks/useRepository';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite, Message, PartageMetier } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;

export default function VueConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: conversation, chargement } = useDocument(conversationsRepo, id);
  const { items: messages } = useCollection<Message>(messagesRepo, { filtre: { conversationId: id } });
  const [texte, setTexte] = useState('');
  const [modalPartage, setModalPartage] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [occupe, setOccupe] = useState(false);

  if (chargement) return <Centre texte="Chargement…" />;
  if (!conversation) return <Centre texte="Conversation introuvable." />;

  const lectureSeule = conversation.etat !== EtatEntite.Actif;
  const tries = [...messages].sort((a, b) => a.envoyeLe.localeCompare(b.envoyeLe));

  const envoyer = async () => {
    const t = texte.trim();
    if (!t) return;
    setTexte('');
    await envoyerTexte(conversation, t, u);
  };

  const partager = async (p: PartageMetier) => {
    setModalPartage(false);
    await envoyerPartage(conversation, p, u);
  };

  const envoyerDepuis = async (selecteur: () => Promise<import('@/services/mediaService').MediaLocal | null>) => {
    try {
      setOccupe(true);
      const media = await selecteur();
      if (media) await envoyerMedia(conversation, media, u);
    } catch (e) {
      Alert.alert('Média', (e as Error).message);
    } finally {
      setOccupe(false);
    }
  };

  const ouvrirPieceJointe = () =>
    Alert.alert('Ajouter', undefined, [
      { text: 'Partager un élément', onPress: () => setModalPartage(true) },
      { text: 'Prendre une photo', onPress: () => envoyerDepuis(prendrePhoto) },
      { text: 'Galerie (photo/vidéo)', onPress: () => envoyerDepuis(choisirImage) },
      { text: 'Fichier', onPress: () => envoyerDepuis(choisirFichier) },
      { text: 'Annuler', style: 'cancel' },
    ]);

  const basculerMicro = async () => {
    try {
      if (!enregistre) {
        await demarrerEnregistrement();
        setEnregistre(true);
      } else {
        setEnregistre(false);
        setOccupe(true);
        const media = await arreterEnregistrement();
        if (media) await envoyerMedia(conversation, media, u);
      }
    } catch (e) {
      setEnregistre(false);
      Alert.alert('Note vocale', (e as Error).message);
    } finally {
      setOccupe(false);
    }
  };

  const ouvrirPartage = async (p: PartageMetier) => {
    const route = routePartage(p);
    if (route) return router.push(route as never);
    // ligne_devis : résoudre le devis parent.
    if (p.entiteType === 'ligne_devis') {
      const ligne = await lignesDevisRepo.lire(p.entiteId);
      if (ligne) router.push(`/(modules)/devis/${ligne.devisId}` as never);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: conversation.nom ?? 'Conversation' }} />

      <FlatList
        data={tries}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messages}
        ListEmptyComponent={<Text style={styles.vide}>Aucun message. Écrivez le premier !</Text>}
        renderItem={({ item }) => <Bulle message={item} mien={item.auteurId === u} onOuvrirPartage={ouvrirPartage} />}
      />

      {lectureSeule ? (
        <View style={styles.barreLecture}>
          <Text style={styles.lectureTexte}>Conversation {conversation.etat === EtatEntite.Archive ? 'archivée' : 'clôturée'} — lecture seule.</Text>
        </View>
      ) : (
        <View style={styles.barre}>
          <Pressable style={styles.partageBtn} onPress={ouvrirPieceJointe} disabled={occupe}>
            <Text style={styles.partageBtnTexte}>＋</Text>
          </Pressable>
          <TextInput style={styles.saisie} value={texte} onChangeText={setTexte} placeholder={enregistre ? 'Enregistrement…' : 'Votre message…'} multiline editable={!enregistre} />
          {occupe ? (
            <ActivityIndicator style={styles.micro} color={couleurs.primaire} />
          ) : texte.trim() ? (
            <Pressable style={styles.envoyer} onPress={envoyer}>
              <Text style={styles.envoyerTexte}>➤</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.micro, enregistre && styles.microActif]} onPress={basculerMicro}>
              <Text style={styles.microTexte}>{enregistre ? '■' : '🎤'}</Text>
            </Pressable>
          )}
        </View>
      )}

      <ModalPartage visible={modalPartage} projetId={conversation.projetId} onAnnuler={() => setModalPartage(false)} onConfirmer={partager} />
    </KeyboardAvoidingView>
  );
}

function Bulle({ message, mien, onOuvrirPartage }: { message: Message; mien: boolean; onOuvrirPartage: (p: PartageMetier) => void }) {
  const heure = new Date(message.envoyeLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={[styles.bulleLigne, mien ? styles.aDroite : styles.aGauche]}>
      <View style={[styles.bulle, mien ? styles.bulleMienne : styles.bulleAutre]}>
        {message.type === 'partage' && message.partage ? (
          <Pressable style={styles.partageCarte} onPress={() => onOuvrirPartage(message.partage!)}>
            <Text style={styles.partageType}>🔗 {LIBELLE_ENTITE_PARTAGEE[message.partage.entiteType]}</Text>
            <Text style={[styles.partageApercu, mien && styles.texteMien]} numberOfLines={2}>{message.partage.apercu}</Text>
            <Text style={[styles.partageAction, mien && styles.texteMienSecondaire]}>Ouvrir ›</Text>
          </Pressable>
        ) : message.type === 'image' && message.mediaUrl ? (
          <Image source={{ uri: message.mediaUrl }} style={styles.image} resizeMode="cover" />
        ) : message.type === 'audio' ? (
          <Text style={[styles.texte, mien && styles.texteMien]}>🎧 Note vocale{message.dureeSecondes ? ` · ${message.dureeSecondes}s` : ''}</Text>
        ) : message.type === 'video' ? (
          <Text style={[styles.texte, mien && styles.texteMien]}>🎬 Vidéo</Text>
        ) : message.type === 'fichier' ? (
          <Text style={[styles.texte, mien && styles.texteMien]}>📎 {message.contenu ?? 'Fichier'}</Text>
        ) : (
          <Text style={[styles.texte, mien && styles.texteMien]}>{message.contenu}</Text>
        )}
        <Text style={[styles.heure, mien && styles.texteMienSecondaire]}>{heure}</Text>
      </View>
    </View>
  );
}

function Centre({ texte }: { texte: string }) {
  return <View style={styles.centre}><Text style={{ color: couleurs.texteSecondaire }}>{texte}</Text></View>;
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.fond },
  messages: { padding: espacements.md, gap: espacements.sm },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  bulleLigne: { flexDirection: 'row' },
  aDroite: { justifyContent: 'flex-end' },
  aGauche: { justifyContent: 'flex-start' },
  bulle: { maxWidth: '80%', borderRadius: rayons.md, padding: espacements.sm, paddingHorizontal: espacements.md },
  bulleMienne: { backgroundColor: couleurs.primaire, borderBottomRightRadius: 2 },
  bulleAutre: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderBottomLeftRadius: 2 },
  texte: { fontSize: 15, color: couleurs.texte },
  texteMien: { color: '#fff' },
  texteMienSecondaire: { color: 'rgba(255,255,255,0.7)' },
  heure: { fontSize: 10, color: couleurs.texteSecondaire, marginTop: 4, alignSelf: 'flex-end' },
  partageCarte: { borderLeftWidth: 3, borderLeftColor: couleurs.accent, paddingLeft: espacements.sm },
  partageType: { fontSize: 12, fontWeight: '700', color: couleurs.accent },
  partageApercu: { fontSize: 15, color: couleurs.texte, marginTop: 2, fontWeight: '600' },
  partageAction: { fontSize: 12, color: couleurs.texteSecondaire, marginTop: 4 },
  barre: { flexDirection: 'row', alignItems: 'flex-end', gap: espacements.sm, padding: espacements.sm, backgroundColor: couleurs.surface, borderTopWidth: 1, borderTopColor: couleurs.bordure },
  partageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: couleurs.fond, alignItems: 'center', justifyContent: 'center' },
  partageBtnTexte: { fontSize: 22, color: couleurs.primaire, fontWeight: '700' },
  saisie: { flex: 1, backgroundColor: couleurs.fond, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: espacements.sm, maxHeight: 120, color: couleurs.texte, fontSize: 15 },
  envoyer: { width: 40, height: 40, borderRadius: 20, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center' },
  envoyerOff: { backgroundColor: couleurs.bordure },
  envoyerTexte: { color: '#fff', fontSize: 18 },
  micro: { width: 40, height: 40, borderRadius: 20, backgroundColor: couleurs.fond, alignItems: 'center', justifyContent: 'center' },
  microActif: { backgroundColor: couleurs.danger },
  microTexte: { fontSize: 18, color: '#fff' },
  image: { width: 200, height: 150, borderRadius: rayons.sm },
  barreLecture: { padding: espacements.md, backgroundColor: couleurs.surface, borderTopWidth: 1, borderTopColor: couleurs.bordure },
  lectureTexte: { color: couleurs.texteSecondaire, textAlign: 'center', fontStyle: 'italic' },
});
