import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useCollection } from '@/hooks/useRepository';
import { catalogueRepo } from '@/services/quantitatifService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { CatalogueOuverture } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;
const TYPES: CatalogueOuverture['type'][] = ['porte', 'fenetre'];
const LIBELLE: Record<CatalogueOuverture['type'], string> = { porte: 'Porte', fenetre: 'Fenêtre' };

export default function Nomenclature() {
  const { items } = useCollection(catalogueRepo);
  const [modal, setModal] = useState(false);
  const [edite, setEdite] = useState<CatalogueOuverture | null>(null);
  const [nom, setNom] = useState('');
  const [type, setType] = useState<CatalogueOuverture['type']>('porte');
  const [largeur, setLargeur] = useState('');
  const [hauteur, setHauteur] = useState('');

  const ouvrir = (c?: CatalogueOuverture) => {
    setEdite(c ?? null);
    setNom(c?.nom ?? '');
    setType(c?.type ?? 'porte');
    setLargeur(c ? String(c.largeur) : '');
    setHauteur(c ? String(c.hauteur) : '');
    setModal(true);
  };

  const enregistrer = async () => {
    const l = Number(largeur.replace(',', '.')) || 0;
    const h = Number(hauteur.replace(',', '.')) || 0;
    if (!nom.trim() || l <= 0 || h <= 0) return;
    const data = { nom: nom.trim(), type, largeur: l, hauteur: h };
    if (edite) await catalogueRepo.modifier(edite.id, data, u);
    else await catalogueRepo.creer(data, u);
    setModal(false);
  };

  const supprimer = (c: CatalogueOuverture) =>
    Alert.alert('Supprimer', c.nom, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => catalogueRepo.supprimer(c.id, u) },
    ]);

  return (
    <View style={styles.conteneur}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.info}>Portes et fenêtres standard, réutilisables dans les pièces (déduction automatique).</Text>
        {items.length === 0 ? <Text style={styles.vide}>Aucun élément.</Text> : null}
        {items.map((c) => (
          <Pressable key={c.id} style={styles.carte} onPress={() => ouvrir(c)} onLongPress={() => supprimer(c)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nom}>{c.nom}</Text>
              <Text style={styles.meta}>{LIBELLE[c.type]} · {c.largeur} × {c.hauteur} m</Text>
            </View>
            <Text style={styles.surf}>{(c.largeur * c.hauteur).toFixed(2)} m²</Text>
          </Pressable>
        ))}
        <Text style={styles.astuce}>Appui : modifier · Appui long : supprimer</Text>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => ouvrir()}><Text style={styles.fabTexte}>+</Text></Pressable>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.boite}>
            <Text style={styles.titre}>{edite ? 'Modifier' : 'Nouvel élément'}</Text>
            <Text style={styles.label}>Désignation *</Text>
            <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="Porte standard" />
            <Text style={styles.label}>Type</Text>
            <View style={styles.chips}>
              {TYPES.map((t) => (
                <Pressable key={t} style={[styles.chip, type === t && styles.chipActif]} onPress={() => setType(t)}>
                  <Text style={[styles.chipTexte, type === t && styles.chipTexteActif]}>{LIBELLE[t]}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.ligne}>
              <View style={styles.moitie}><Text style={styles.label}>Largeur (m)</Text><TextInput style={styles.champ} value={largeur} onChangeText={setLargeur} keyboardType="numeric" /></View>
              <View style={styles.moitie}><Text style={styles.label}>Hauteur (m)</Text><TextInput style={styles.champ} value={hauteur} onChangeText={setHauteur} keyboardType="numeric" /></View>
            </View>
            <View style={styles.actions}>
              <Pressable style={[styles.bouton, styles.secondaire]} onPress={() => setModal(false)}><Text style={styles.secondaireTexte}>Annuler</Text></Pressable>
              <Pressable style={[styles.bouton, styles.primaire]} onPress={enregistrer}><Text style={styles.primaireTexte}>Valider</Text></Pressable>
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
  info: { fontSize: 13, color: couleurs.texteSecondaire, marginBottom: espacements.xs },
  vide: { color: couleurs.texteSecondaire, textAlign: 'center', marginTop: espacements.xl },
  carte: { flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  nom: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  meta: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  surf: { fontSize: 15, fontWeight: '700', color: couleurs.primaire },
  astuce: { fontSize: 12, fontStyle: 'italic', color: couleurs.texteSecondaire, marginTop: espacements.xs },
  fab: { position: 'absolute', right: espacements.lg, bottom: espacements.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: couleurs.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabTexte: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  boite: { backgroundColor: couleurs.surface, borderTopLeftRadius: rayons.lg, borderTopRightRadius: rayons.lg, padding: espacements.lg },
  titre: { fontSize: 18, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.sm, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  chips: { flexDirection: 'row', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacements.sm, marginTop: espacements.md },
  bouton: { paddingVertical: espacements.sm, paddingHorizontal: espacements.md, borderRadius: rayons.sm },
  secondaire: { backgroundColor: couleurs.fond },
  secondaireTexte: { color: couleurs.texte, fontWeight: '600' },
  primaire: { backgroundColor: couleurs.accent },
  primaireTexte: { color: '#fff', fontWeight: '700' },
});
