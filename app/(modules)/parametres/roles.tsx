import { useCollection } from '@/hooks/useRepository';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATALOGUE_PERMISSIONS, LIBELLE_ROLE, rolesRepo } from '@/services/parametreService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { Role } from '@/types/models';

const u = UTILISATEUR_COURANT_ID;

export default function EcranRoles() {
  const { items } = useCollection(rolesRepo);

  const basculer = async (role: Role, cle: string) => {
    const actif = role.permissions.includes(cle);
    const permissions = actif ? role.permissions.filter((p) => p !== cle) : [...role.permissions, cle];
    await rolesRepo.modifier(role.id, { permissions }, u);
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={styles.info}>Cochez les modules que chaque rôle peut gérer.</Text>
      {items.map((role) => (
        <View key={role.id} style={styles.carte}>
          <Text style={styles.roleNom}>{LIBELLE_ROLE[role.cle]}</Text>
          <View style={styles.chips}>
            {CATALOGUE_PERMISSIONS.map((perm) => {
              const actif = role.permissions.includes(perm.cle);
              return (
                <Pressable key={perm.cle} style={[styles.chip, actif && styles.chipActif]} onPress={() => basculer(role, perm.cle)}>
                  <Text style={[styles.chipTexte, actif && styles.chipTexteActif]}>{perm.libelle}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {items.length === 0 ? <Text style={styles.vide}>Aucun rôle configuré.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, gap: espacements.sm },
  info: { fontSize: 13, color: couleurs.texteSecondaire, marginBottom: espacements.xs },
  vide: { color: couleurs.texteSecondaire, textAlign: 'center', marginTop: espacements.xl },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  roleNom: { fontSize: 16, fontWeight: '700', color: couleurs.texte, marginBottom: espacements.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs },
  chip: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.lg, paddingHorizontal: espacements.md, paddingVertical: 6, backgroundColor: couleurs.fond },
  chipActif: { backgroundColor: couleurs.primaire, borderColor: couleurs.primaire },
  chipTexte: { color: couleurs.texte, fontSize: 13 },
  chipTexteActif: { color: '#fff', fontWeight: '700' },
});
