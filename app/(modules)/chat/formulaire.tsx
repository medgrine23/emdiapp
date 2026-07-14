import { useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { conversationsRepo, LIBELLE_TYPE_CONVERSATION } from '@/services/chatService';
import { tachesRepo } from '@/services/planningService';
import { projetsRepo } from '@/services/projetService';
import { SansMeta } from '@/services/repository';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { useCollection } from '@/hooks/useRepository';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Conversation, TypeConversation } from '@/types/models';

const TYPES = Object.keys(LIBELLE_TYPE_CONVERSATION) as TypeConversation[];
const u = UTILISATEUR_COURANT_ID;

export default function FormulaireConversation() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const edition = Boolean(id);
  const router = useRouter();
  const { items: projets } = useCollection(projetsRepo);
  const { items: taches } = useCollection(tachesRepo);

  const [nom, setNom] = useState('');
  const [type, setType] = useState<TypeConversation>('groupe');
  const [projetId, setProjetId] = useState<string | null>(null);
  const [tacheId, setTacheId] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const tachesDuProjet = useMemo(() => taches.filter((t) => t.projetId === projetId), [taches, projetId]);

  useEffect(() => {
    if (!id) return;
    conversationsRepo.lire(id).then((c) => {
      if (!c) return;
      setNom(c.nom ?? '');
      setType(c.type);
      setProjetId(c.projetId ?? null);
      setTacheId(c.tachePlanningId ?? null);
    });
  }, [id]);

  const enregistrer = async () => {
    if (!nom.trim()) return setErreur('Le nom de la conversation est obligatoire.');
    const base = {
      nom: nom.trim(),
      type,
      projetId: projetId ?? null,
      participantIds: [u],
      tachePlanningId: type === 'tache' ? tacheId : null,
    };
    if (edition && id) {
      await conversationsRepo.modifier(id, base, u);
      router.back();
    } else {
      const cree = await conversationsRepo.creer(base as SansMeta<Conversation>, u);
      router.replace(`/(modules)/chat/${cree.id}`);
    }
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: edition ? 'Modifier la conversation' : 'Nouvelle conversation' }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <Label texte="Nom *" />
      <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="Ex : Équipe gros œuvre" />

      <Label texte="Type" />
      <View style={styles.chips}>
        {TYPES.map((t) => (
          <Chip key={t} actif={type === t} label={LIBELLE_TYPE_CONVERSATION[t]} onPress={() => setType(t)} />
        ))}
      </View>

      <Label texte="Projet (optionnel)" />
      <View style={styles.chips}>
        <Chip actif={projetId === null} label="Aucun" onPress={() => { setProjetId(null); setTacheId(null); }} />
        {projets.map((p) => (
          <Chip key={p.id} actif={projetId === p.id} label={p.reference} onPress={() => setProjetId(p.id)} />
        ))}
      </View>

      {type === 'tache' && projetId ? (
        <>
          <Label texte="Tâche associée" />
          <View style={styles.chips}>
            {tachesDuProjet.length === 0 ? (
              <Text style={styles.aide}>Aucune tâche pour ce projet.</Text>
            ) : (
              tachesDuProjet.map((t) => (
                <Chip key={t.id} actif={tacheId === t.id} label={t.nom} onPress={() => setTacheId(tacheId === t.id ? null : t.id)} />
              ))
            )}
          </View>
        </>
      ) : null}

      <Pressable style={styles.valider} onPress={enregistrer}>
        <Text style={styles.validerTexte}>{edition ? 'Enregistrer' : 'Créer la conversation'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Label({ texte }: { texte: string }) {
  return <Text style={styles.label}>{texte}</Text>;
}
function Chip({ label, actif, onPress }: { label: string; actif: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, actif && styles.chipActif]} onPress={onPress}>
      <Text style={[styles.chipTexte, actif && styles.chipTexteActif]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  erreur: { color: couleurs.danger, backgroundColor: `${couleurs.danger}10`, padding: espacements.sm, borderRadius: rayons.sm, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.surface, maxWidth: '100%' },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
  aide: { color: couleurs.texteSecondaire, fontSize: 13 },
  valider: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  validerTexte: { color: couleurs.surAccent, fontWeight: '700', fontSize: 16 },
});
