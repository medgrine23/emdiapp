import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { clientsRepo } from '@/services/parametreService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Client, TypeClient } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;
const TYPES: TypeClient[] = ['particulier', 'entreprise', 'collectivite'];
const LIBELLE: Record<TypeClient, string> = { particulier: 'Particulier', entreprise: 'Entreprise', collectivite: 'Collectivité' };

export default function EcranClients() {
  const { items } = useCollection(clientsRepo);
  const [modal, setModal] = useState(false);
  const [edite, setEdite] = useState<Client | null>(null);
  const [nom, setNom] = useState('');
  const [type, setType] = useState<TypeClient>('entreprise');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [nif, setNif] = useState('');
  const [rc, setRc] = useState('');

  const ouvrir = (c?: Client) => {
    setEdite(c ?? null);
    setNom(c?.nom ?? '');
    setType(c?.type ?? 'entreprise');
    setEmail(c?.email ?? '');
    setTelephone(c?.telephone ?? '');
    setAdresse(c?.adresse ?? '');
    setNif(c?.nif ?? '');
    setRc(c?.rc ?? '');
    setModal(true);
  };

  const enregistrer = async () => {
    if (!nom.trim()) return;
    const data = { nom: nom.trim(), type, email: email.trim(), telephone: telephone.trim(), adresse: adresse.trim(), nif: nif.trim(), rc: rc.trim() };
    if (edite) await clientsRepo.modifier(edite.id, data, u);
    else await clientsRepo.creer(data, u);
    setModal(false);
  };

  const supprimer = (c: Client) =>
    Alert.alert('Supprimer', c.nom, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => clientsRepo.supprimer(c.id, u) },
    ]);

  return (
    <View style={styles.conteneur}>
      <ScrollView contentContainerStyle={styles.contenu}>
        {items.length === 0 ? <Text style={styles.vide}>Aucun client.</Text> : null}
        {items.map((c) => (
          <Pressable key={c.id} style={styles.carte} onPress={() => ouvrir(c)} onLongPress={() => supprimer(c)}>
            <Text style={styles.nom}>{c.nom}</Text>
            <Text style={styles.meta}>{LIBELLE[c.type]}{c.telephone ? ` · ${c.telephone}` : ''}</Text>
          </Pressable>
        ))}
        <Text style={styles.astuce}>Appui : modifier · Appui long : supprimer</Text>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => ouvrir()}>
        <Text style={styles.fabTexte}>+</Text>
      </Pressable>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.boite}>
            <ScrollView>
              <Text style={styles.titre}>{edite ? 'Modifier le client' : 'Nouveau client'}</Text>
              <Text style={styles.label}>Nom *</Text>
              <TextInput style={styles.champ} value={nom} onChangeText={setNom} />
              <Text style={styles.label}>Type</Text>
              <View style={styles.chips}>
                {TYPES.map((t) => (
                  <Pressable key={t} style={[styles.chip, type === t && styles.chipActif]} onPress={() => setType(t)}>
                    <Text style={[styles.chipTexte, type === t && styles.chipTexteActif]}>{LIBELLE[t]}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.champ} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <Text style={styles.label}>Téléphone</Text>
              <TextInput style={styles.champ} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
              <Text style={styles.label}>Adresse</Text>
              <TextInput style={styles.champ} value={adresse} onChangeText={setAdresse} />
              <Text style={styles.label}>NIF (requis pour la déduction de TVA)</Text>
              <TextInput style={styles.champ} value={nif} onChangeText={setNif} keyboardType="numeric" />
              <Text style={styles.label}>RC (registre de commerce)</Text>
              <TextInput style={styles.champ} value={rc} onChangeText={setRc} />
              <View style={styles.actions}>
                <Pressable style={[styles.bouton, styles.secondaire]} onPress={() => setModal(false)}>
                  <Text style={styles.secondaireTexte}>Annuler</Text>
                </Pressable>
                <Pressable style={[styles.bouton, styles.primaire]} onPress={enregistrer}>
                  <Text style={styles.primaireTexte}>Valider</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, gap: espacements.sm },
  vide: { color: couleurs.texteSecondaire, textAlign: 'center', marginTop: espacements.xl },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  nom: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  astuce: { fontSize: 12, fontStyle: 'italic', color: couleurs.texteSecondaire, marginTop: espacements.xs },
  fab: { position: 'absolute', right: espacements.lg, bottom: espacements.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabTexte: { color: couleurs.surAccent, fontSize: 30, lineHeight: 34, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg, maxHeight: '88%' },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.lg },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  primaireTexte: { color: couleurs.surAccent, fontWeight: '700' },
});
