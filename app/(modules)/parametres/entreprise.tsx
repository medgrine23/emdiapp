import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { entrepriseRepo, getEntreprise } from '@/services/parametreService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';

const u = UTILISATEUR_COURANT_ID;

export default function EcranEntreprise() {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [siret, setSiret] = useState('');
  const [numeroTVA, setNumeroTVA] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    getEntreprise().then((e) => {
      setId(e.id);
      setNom(e.nom);
      setAdresse(e.adresse ?? '');
      setSiret(e.siret ?? '');
      setNumeroTVA(e.numeroTVA ?? '');
      setTelephone(e.telephone ?? '');
      setEmail(e.email ?? '');
    });
  }, []);

  const enregistrer = async () => {
    if (!id) return;
    await entrepriseRepo.modifier(
      id,
      { nom: nom.trim(), adresse: adresse.trim(), siret: siret.trim(), numeroTVA: numeroTVA.trim(), telephone: telephone.trim(), email: email.trim() },
      u
    );
    router.back();
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Champ label="Nom *" valeur={nom} onChange={setNom} />
      <Champ label="Adresse" valeur={adresse} onChange={setAdresse} />
      <Champ label="SIRET" valeur={siret} onChange={setSiret} />
      <Champ label="N° TVA" valeur={numeroTVA} onChange={setNumeroTVA} />
      <Champ label="Téléphone" valeur={telephone} onChange={setTelephone} />
      <Champ label="Email" valeur={email} onChange={setEmail} />

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>Enregistrer</Text>
      </Pressable>
    </ScrollView>
  );
}

function Champ({ label, valeur, onChange }: { label: string; valeur: string; onChange: (v: string) => void }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.champ} value={valeur} onChangeText={onChange} autoCapitalize="none" />
    </>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: couleurs.surAccent, fontWeight: '700', fontSize: 16 },
});
