import { Link, useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { conversationsRepo, LIBELLE_TYPE_CONVERSATION } from '@/services/chatService';
import { projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { useCollection } from '@/hooks/useRepository';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite } from '@/types/models';
import { formaterDate } from '@/utils/format';

const u = UTILISATEUR_COURANT_ID;

export default function ListeConversations() {
  const router = useRouter();
  const { items, chargement } = useCollection(conversationsRepo);
  const { items: projets } = useCollection(projetsRepo);
  const refProjet = (id?: string | null) => (id ? projets.find((p) => p.id === id)?.reference : null);

  const options = (id: string, nom: string, etat: EtatEntite) => {
    if (etat !== EtatEntite.Actif) return;
    Alert.alert(nom, undefined, [
      { text: 'Archiver', onPress: () => conversationsRepo.archiver(id, u) },
      { text: 'Supprimer', style: 'destructive', onPress: () => conversationsRepo.supprimer(id, u) },
      { text: 'Fermer', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.conteneur}>
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <Text style={styles.vide}>{chargement ? 'Chargement…' : 'Aucune conversation. Appuyez sur + pour en créer une.'}</Text>
        }
        renderItem={({ item }) => {
          const ref = refProjet(item.projetId);
          return (
            <Link href={`/(modules)/chat/${item.id}`} asChild>
              <Pressable style={styles.carte} onLongPress={() => options(item.id, item.nom ?? 'Conversation', item.etat)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexte}>{(item.nom ?? '?').slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.ligneHaut}>
                    <Text style={styles.nom} numberOfLines={1}>{item.nom ?? 'Conversation'}</Text>
                    <BadgeEtat etat={item.etat} />
                  </View>
                  <Text style={styles.meta}>
                    {LIBELLE_TYPE_CONVERSATION[item.type]}{ref ? ` · ${ref}` : ''}
                    {item.dernierMessageLe ? ` · ${formaterDate(item.dernierMessageLe)}` : ''}
                  </Text>
                </View>
              </Pressable>
            </Link>
          );
        }}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/(modules)/chat/formulaire')}>
        <Text style={styles.fabTexte}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  liste: { padding: espacements.md, gap: espacements.sm },
  vide: { textAlign: 'center', color: couleurs.texteSecondaire, marginTop: espacements.xl },
  carte: { flexDirection: 'row', alignItems: 'center', gap: espacements.md, backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: couleurs.primaireClair, alignItems: 'center', justifyContent: 'center' },
  avatarTexte: { color: '#fff', fontSize: 18, fontWeight: '700' },
  ligneHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: espacements.sm },
  nom: { fontSize: 16, fontWeight: '700', color: couleurs.texte, flex: 1 },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  fab: { position: 'absolute', right: espacements.lg, bottom: espacements.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabTexte: { color: couleurs.surAccent, fontSize: 30, lineHeight: 34, fontWeight: '700' },
});
