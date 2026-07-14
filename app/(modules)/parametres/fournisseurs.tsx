import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { fournisseursRepo } from '@/services/parametreService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Fournisseur } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;

export default function EcranFournisseurs() {
  const { items } = useCollection(fournisseursRepo);
  const [modal, setModal] = useState(false);
  const [edite, setEdite] = useState<Fournisseur | null>(null);
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');

  const ouvrir = (f?: Fournisseur) => {
    setEdite(f ?? null);
    setNom(f?.nom ?? '');
    setContact(f?.contact ?? '');
    setEmail(f?.email ?? '');
    setTelephone(f?.telephone ?? '');
    setAdresse(f?.adresse ?? '');
    setModal(true);
  };

  const enregistrer = async () => {
    if (!nom.trim()) return;
    const data = { nom: nom.trim(), contact: contact.trim(), email: email.trim(), telephone: telephone.trim(), adresse: adresse.trim() };
    if (edite) await fournisseursRepo.modifier(edite.id, data, u);
    else await fournisseursRepo.creer(data, u);
    setModal(false);
  };

  const supprimer = (f: Fournisseur) =>
    Alert.alert('Supprimer', f.nom, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => fournisseursRepo.supprimer(f.id, u) },
    ]);

  return (
    <View style={styles.conteneur}>
      <ScrollView contentContainerStyle={styles.contenu}>
        {items.length === 0 ? <Text style={styles.vide}>Aucun fournisseur.</Text> : null}
        {items.map((f) => (
          <Pressable key={f.id} style={styles.carte} onPress={() => ouvrir(f)} onLongPress={() => supprimer(f)}>
            <Text style={styles.nom}>{f.nom}</Text>
            <Text style={styles.meta}>{f.contact ?? ''}{f.telephone ? ` · ${f.telephone}` : ''}</Text>
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
              <Text style={styles.titre}>{edite ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</Text>
              <Text style={styles.label}>Nom *</Text>
              <TextInput style={styles.champ} value={nom} onChangeText={setNom} />
              <Text style={styles.label}>Contact</Text>
              <TextInput style={styles.champ} value={contact} onChangeText={setContact} />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.champ} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <Text style={styles.label}>Téléphone</Text>
              <TextInput style={styles.champ} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
              <Text style={styles.label}>Adresse</Text>
              <TextInput style={styles.champ} value={adresse} onChangeText={setAdresse} />
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
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.lg },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  primaireTexte: { color: couleurs.surAccent, fontWeight: '700' },
});
