import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { taxesRepo } from '@/services/parametreService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Taxe } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;

export default function EcranTaxes() {
  const { items } = useCollection(taxesRepo);
  const [modal, setModal] = useState(false);
  const [edite, setEdite] = useState<Taxe | null>(null);
  const [nom, setNom] = useState('');
  const [taux, setTaux] = useState('');
  const [parDefaut, setParDefaut] = useState(false);

  const ouvrir = (t?: Taxe) => {
    setEdite(t ?? null);
    setNom(t?.nom ?? '');
    setTaux(t ? String(t.taux) : '');
    setParDefaut(t?.parDefaut ?? false);
    setModal(true);
  };

  const enregistrer = async () => {
    const data = { nom: nom.trim() || 'TVA', taux: Number(taux.replace(',', '.')) || 0, parDefaut };
    if (edite) await taxesRepo.modifier(edite.id, data, u);
    else await taxesRepo.creer(data, u);
    setModal(false);
  };

  const supprimer = (t: Taxe) =>
    Alert.alert('Supprimer', t.nom, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => taxesRepo.supprimer(t.id, u) },
    ]);

  return (
    <View style={styles.conteneur}>
      <View style={styles.contenu}>
        {items.length === 0 ? <Text style={styles.vide}>Aucune taxe.</Text> : null}
        {items.map((t) => (
          <Pressable key={t.id} style={styles.carte} onPress={() => ouvrir(t)} onLongPress={() => supprimer(t)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nom}>{t.nom}</Text>
              {t.parDefaut ? <Text style={styles.defaut}>Par défaut</Text> : null}
            </View>
            <Text style={styles.taux}>{t.taux} %</Text>
          </Pressable>
        ))}
        <Text style={styles.astuce}>Appui : modifier · Appui long : supprimer</Text>
      </View>

      <Pressable style={styles.fab} onPress={() => ouvrir()}>
        <Text style={styles.fabTexte}>+</Text>
      </Pressable>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.boite}>
            <Text style={styles.titre}>{edite ? 'Modifier la taxe' : 'Nouvelle taxe'}</Text>
            <Text style={styles.label}>Nom</Text>
            <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="TVA" />
            <Text style={styles.label}>Taux (%)</Text>
            <TextInput style={styles.champ} value={taux} onChangeText={setTaux} keyboardType="numeric" />
            <Pressable style={styles.checkRow} onPress={() => setParDefaut((v) => !v)}>
              <View style={[styles.check, parDefaut && styles.checkOn]}>{parDefaut ? <Text style={styles.checkMark}>✓</Text> : null}</View>
              <Text style={styles.checkLabel}>Taxe par défaut</Text>
            </Pressable>
            <View style={styles.actions}>
              <Pressable style={[styles.bouton, styles.secondaire]} onPress={() => setModal(false)}>
                <Text style={styles.secondaireTexte}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.bouton, styles.primaire]} onPress={enregistrer}>
                <Text style={styles.primaireTexte}>Valider</Text>
              </Pressable>
            </View>
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
  carte: { flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  nom: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  defaut: { fontSize: 12, color: couleurs.succes, fontWeight: '600', marginTop: 2 },
  taux: { fontSize: 18, fontWeight: '800', color: couleurs.primaire },
  astuce: { fontSize: 12, fontStyle: 'italic', color: couleurs.texteSecondaire, marginTop: espacements.xs },
  fab: { position: 'absolute', right: espacements.lg, bottom: espacements.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabTexte: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm, marginTop: espacements.md },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: couleurs.bordure, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  checkMark: { color: '#fff', fontWeight: '900' },
  checkLabel: { fontSize: 15, color: couleurs.texte },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.lg },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  primaireTexte: { color: '#fff', fontWeight: '700' },
});
