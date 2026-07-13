import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { CATALOGUE_NOTIFICATIONS, notificationsRepo } from '@/services/parametreService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';

const u = UTILISATEUR_COURANT_ID;

export default function EcranNotifications() {
  const { items } = useCollection(notificationsRepo, { filtre: { utilisateurId: u } });

  const estActif = (type: string) => items.find((n) => n.type === type)?.actif ?? true;

  const basculer = async (type: string, valeur: boolean) => {
    const existant = items.find((n) => n.type === type);
    if (existant) {
      await notificationsRepo.modifier(existant.id, { actif: valeur }, u);
    } else {
      await notificationsRepo.creer({ utilisateurId: u, type, canal: 'push', actif: valeur }, u);
    }
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={styles.info}>Recevoir une notification push pour :</Text>
      <View style={styles.carte}>
        {CATALOGUE_NOTIFICATIONS.map((n, i) => (
          <View key={n.type} style={[styles.ligne, i > 0 && styles.borde]}>
            <Text style={styles.libelle}>{n.libelle}</Text>
            <Switch value={estActif(n.type)} onValueChange={(v) => basculer(n.type, v)} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md },
  info: { fontSize: 13, color: couleurs.texteSecondaire, marginBottom: espacements.sm },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, paddingHorizontal: espacements.md },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: espacements.md },
  borde: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: couleurs.bordure },
  libelle: { fontSize: 15, color: couleurs.texte, flex: 1 },
});
