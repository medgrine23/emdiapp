import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChampDate } from '@/components/ChampDate';
import { useCollection } from '@/hooks/useRepository';
import { projetsRepo } from '@/services/projetService';
import { exporterExcel, exporterPDF } from '@/services/exportFichiers';
import {
  construireHtml,
  construireRapport,
  LIBELLE_PERIODE,
  MODULES_RAPPORT,
  presetPeriode,
  TypePeriode,
} from '@/services/rapportExportService';
import { couleurs, espacements, rayons } from '@/theme/theme';

const PERIODES: TypePeriode[] = ['journalier', 'hebdomadaire', 'mensuel', 'personnalise'];
const aujourdhui = () => new Date().toISOString().slice(0, 10);

export default function ExportRapport() {
  const { items: projets } = useCollection(projetsRepo);
  const [projetId, setProjetId] = useState<string | null>(null);
  const [periode, setPeriode] = useState<TypePeriode>('mensuel');
  const [debut, setDebut] = useState(aujourdhui());
  const [fin, setFin] = useState(aujourdhui());
  const [modules, setModules] = useState<string[]>(MODULES_RAPPORT.map((m) => m.cle));
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const web = Platform.OS === 'web';

  const bornes = () => (periode === 'personnalise' ? { debut, fin } : presetPeriode(periode));

  const basculerModule = (cle: string) =>
    setModules((prev) => (prev.includes(cle) ? prev.filter((c) => c !== cle) : [...prev, cle]));

  const generer = async (format: 'pdf' | 'excel') => {
    setMessage(null);
    if (modules.length === 0) return setMessage('Sélectionnez au moins un module.');
    const { debut: d, fin: f } = bornes();
    if (d > f) return setMessage('La date de début doit précéder la date de fin.');
    try {
      setOccupe(true);
      const rapport = await construireRapport({ projetId, debut: d, fin: f, modules });
      const html = construireHtml(rapport);
      const nom = `rapport-${d}_${f}`;
      if (format === 'pdf') await exporterPDF(html);
      else await exporterExcel(html, nom);
    } catch (e) {
      setMessage((e as Error).message || "Erreur lors de l'export.");
    } finally {
      setOccupe(false);
    }
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: 'Exporter un rapport' }} />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Label texte="Projet" />
      <View style={styles.chips}>
        <Chip actif={projetId === null} label="Tous" onPress={() => setProjetId(null)} />
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
      </View>

      <Label texte="Période" />
      <View style={styles.chips}>
        {PERIODES.map((p) => (
          <Chip key={p} actif={periode === p} label={LIBELLE_PERIODE[p]} onPress={() => setPeriode(p)} />
        ))}
      </View>

      {periode === 'personnalise' ? (
        <View style={styles.ligne}>
          <View style={styles.moitie}><ChampDate label="Début" value={debut} onChange={setDebut} /></View>
          <View style={styles.moitie}><ChampDate label="Fin" value={fin} onChange={setFin} /></View>
        </View>
      ) : null}

      <Label texte="Modules à inclure" />
      <View style={styles.carte}>
        {MODULES_RAPPORT.map((m, i) => {
          const coche = modules.includes(m.cle);
          return (
            <Pressable key={m.cle} style={[styles.moduleLigne, i > 0 && styles.borde]} onPress={() => basculerModule(m.cle)}>
              <View style={[styles.case, coche && styles.caseOn]}>
                {coche ? <Feather name="check" size={14} color="#fff" /> : null}
              </View>
              <Text style={styles.moduleLabel}>{m.libelle}</Text>
            </Pressable>
          );
        })}
      </View>

      {web ? (
        <Text style={styles.note}>L'export PDF/Excel est disponible sur l'application mobile (Android/iOS).</Text>
      ) : (
        <View style={styles.boutons}>
          <Pressable style={[styles.btn, styles.btnPdf, occupe && styles.btnOff]} onPress={() => generer('pdf')} disabled={occupe}>
            {occupe ? <ActivityIndicator color="#fff" /> : <><Feather name="file-text" size={18} color="#fff" /><Text style={styles.btnTexte}>PDF</Text></>}
          </Pressable>
          <Pressable style={[styles.btn, styles.btnExcel, occupe && styles.btnOff]} onPress={() => generer('excel')} disabled={occupe}>
            {occupe ? <ActivityIndicator color="#fff" /> : <><Feather name="grid" size={18} color="#fff" /><Text style={styles.btnTexte}>Excel</Text></>}
          </Pressable>
        </View>
      )}
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
  message: { color: couleurs.danger, backgroundColor: `${couleurs.danger}10`, padding: espacements.sm, borderRadius: rayons.sm, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  ligne: { flexDirection: 'row', gap: espacements.sm },
  moitie: { flex: 1 },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, paddingHorizontal: espacements.md },
  moduleLigne: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm, paddingVertical: espacements.md },
  borde: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: couleurs.bordure },
  case: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: couleurs.bordure, alignItems: 'center', justifyContent: 'center' },
  caseOn: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  moduleLabel: { fontSize: 15, color: couleurs.texte },
  note: { marginTop: espacements.lg, color: couleurs.texteSecondaire, fontStyle: 'italic', textAlign: 'center' },
  boutons: { flexDirection: 'row', gap: espacements.sm, marginTop: espacements.lg },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacements.sm, borderRadius: rayons.md, padding: espacements.md },
  btnPdf: { backgroundColor: couleurs.danger },
  btnExcel: { backgroundColor: couleurs.succes },
  btnOff: { opacity: 0.7 },
  btnTexte: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
