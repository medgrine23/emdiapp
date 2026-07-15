import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { entrepriseRepo, getEntreprise, LIBELLE_FORME_JURIDIQUE } from '@/services/parametreService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { FormeJuridique } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;
const FORMES = Object.keys(LIBELLE_FORME_JURIDIQUE) as FormeJuridique[];

export default function EcranEntreprise() {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [v, setV] = useState({
    nom: '', formeJuridique: '' as FormeJuridique | '', capitalSocial: '', activite: '',
    adresse: '', telephone: '', email: '',
    nif: '', nis: '', rc: '', articleImposition: '',
    banque: '', rib: '',
  });
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  useEffect(() => {
    getEntreprise().then((e) => {
      setId(e.id);
      setV({
        nom: e.nom ?? '',
        formeJuridique: e.formeJuridique ?? '',
        capitalSocial: e.capitalSocial != null ? String(e.capitalSocial) : '',
        activite: e.activite ?? '',
        adresse: e.adresse ?? '',
        telephone: e.telephone ?? '',
        email: e.email ?? '',
        nif: e.nif ?? '',
        nis: e.nis ?? '',
        rc: e.rc ?? '',
        articleImposition: e.articleImposition ?? '',
        banque: e.banque ?? '',
        rib: e.rib ?? '',
      });
    });
  }, []);

  const enregistrer = async () => {
    if (!id) return;
    await entrepriseRepo.modifier(
      id,
      {
        nom: v.nom.trim(),
        formeJuridique: v.formeJuridique || undefined,
        capitalSocial: v.capitalSocial ? Number(v.capitalSocial.replace(/\s/g, '')) : undefined,
        activite: v.activite.trim() || undefined,
        adresse: v.adresse.trim() || undefined,
        telephone: v.telephone.trim() || undefined,
        email: v.email.trim() || undefined,
        nif: v.nif.trim() || undefined,
        nis: v.nis.trim() || undefined,
        rc: v.rc.trim() || undefined,
        articleImposition: v.articleImposition.trim() || undefined,
        banque: v.banque.trim() || undefined,
        rib: v.rib.trim() || undefined,
      },
      u
    );
    router.back();
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={styles.aide}>Ces informations apparaîtront sur vos devis et factures (conformité Algérie — décret 05-468).</Text>

      <Section titre="Identité" />
      <Champ label="Raison sociale *" valeur={v.nom} onChange={(x) => set('nom', x)} />
      <Text style={styles.label}>Forme juridique</Text>
      <View style={styles.chips}>
        {FORMES.map((f) => (
          <Pressable key={f} style={[styles.chip, v.formeJuridique === f && styles.chipActif]} onPress={() => set('formeJuridique', v.formeJuridique === f ? '' : f)}>
            <Text style={[styles.chipTexte, v.formeJuridique === f && styles.chipTexteActif]}>{LIBELLE_FORME_JURIDIQUE[f]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.ligne}>
        <View style={styles.moitie}><Champ label="Capital social (DZD)" valeur={v.capitalSocial} onChange={(x) => set('capitalSocial', x)} numerique /></View>
        <View style={styles.moitie}><Champ label="Activité" valeur={v.activite} onChange={(x) => set('activite', x)} /></View>
      </View>

      <Section titre="Coordonnées" />
      <Champ label="Adresse du siège" valeur={v.adresse} onChange={(x) => set('adresse', x)} />
      <View style={styles.ligne}>
        <View style={styles.moitie}><Champ label="Téléphone" valeur={v.telephone} onChange={(x) => set('telephone', x)} /></View>
        <View style={styles.moitie}><Champ label="Email" valeur={v.email} onChange={(x) => set('email', x)} /></View>
      </View>

      <Section titre="Identifiants légaux" />
      <Champ label="NIF — n° d'identification fiscale (15 chiffres)" valeur={v.nif} onChange={(x) => set('nif', x)} numerique />
      <View style={styles.ligne}>
        <View style={styles.moitie}><Champ label="NIS — n° statistique" valeur={v.nis} onChange={(x) => set('nis', x)} numerique /></View>
        <View style={styles.moitie}><Champ label="RC — registre de commerce" valeur={v.rc} onChange={(x) => set('rc', x)} /></View>
      </View>
      <Champ label="N° d'article d'imposition" valeur={v.articleImposition} onChange={(x) => set('articleImposition', x)} />

      <Section titre="Coordonnées bancaires" />
      <View style={styles.ligne}>
        <View style={styles.moitie}><Champ label="Banque" valeur={v.banque} onChange={(x) => set('banque', x)} /></View>
        <View style={styles.moitie}><Champ label="RIB" valeur={v.rib} onChange={(x) => set('rib', x)} numerique /></View>
      </View>

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>Enregistrer</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ titre }: { titre: string }) {
  return <Text style={styles.section}>{titre}</Text>;
}
function Champ({ label, valeur, onChange, numerique }: { label: string; valeur: string; onChange: (v: string) => void; numerique?: boolean }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.champ}
        value={valeur}
        onChangeText={onChange}
        keyboardType={numerique ? 'numeric' : 'default'}
        autoCapitalize={label.toLowerCase().includes('email') ? 'none' : 'sentences'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  aide: { fontSize: 13, color: couleurs.texteSecondaire, fontStyle: 'italic', marginBottom: espacements.sm },
  section: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, color: couleurs.primaire, marginTop: espacements.lg, marginBottom: espacements.xs },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: couleurs.surAccent, fontWeight: '700', fontSize: 16 },
});
