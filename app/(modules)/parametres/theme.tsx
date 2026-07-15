import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getChoixTheme, setChoixTheme, type ChoixTheme } from '@/services/preferences';
import { couleurs, espacements, rayons, schemaActif } from '@/theme/theme';

type NomIcone = ComponentProps<typeof Feather>['name'];

const OPTIONS: { cle: ChoixTheme; titre: string; desc: string; icone: NomIcone }[] = [
  { cle: 'auto', titre: 'Automatique', desc: 'Suit le réglage clair / sombre du téléphone', icone: 'smartphone' },
  { cle: 'clair', titre: 'Clair', desc: 'Interface claire en permanence', icone: 'sun' },
  { cle: 'sombre', titre: 'Sombre', desc: 'Interface sombre en permanence', icone: 'moon' },
];

export default function EcranTheme() {
  const [choix, setChoix] = useState<ChoixTheme>(() => getChoixTheme());
  const [enregistre, setEnregistre] = useState(false);

  const choisir = (c: ChoixTheme) => {
    setChoix(c);
    setChoixTheme(c);
    setEnregistre(true);
  };

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Text style={styles.aide}>
        Choisissez l'apparence de l'application. Le thème actuellement affiché est{' '}
        <Text style={styles.gras}>{schemaActif === 'dark' ? 'sombre' : 'clair'}</Text>.
      </Text>

      {OPTIONS.map((o) => {
        const actif = choix === o.cle;
        return (
          <Pressable key={o.cle} style={[styles.carte, actif && styles.carteActive]} onPress={() => choisir(o.cle)}>
            <View style={[styles.iconeBox, actif && styles.iconeBoxActive]}>
              <Feather name={o.icone} size={20} color={actif ? couleurs.surAccent : couleurs.primaireClair} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.titre}>{o.titre}</Text>
              <Text style={styles.desc}>{o.desc}</Text>
            </View>
            <Feather name={actif ? 'check-circle' : 'circle'} size={22} color={actif ? couleurs.primaire : couleurs.bordure} />
          </Pressable>
        );
      })}

      {enregistre ? (
        <View style={styles.info}>
          <Feather name="refresh-cw" size={16} color={couleurs.primaire} />
          <Text style={styles.infoTexte}>
            Choix enregistré. Fermez puis rouvrez l'application pour appliquer le nouveau thème.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, gap: espacements.sm },
  aide: { fontSize: 13, color: couleurs.texteSecondaire, marginBottom: espacements.xs },
  gras: { fontWeight: '800', color: couleurs.texte },
  carte: { flexDirection: 'row', alignItems: 'center', gap: espacements.md, backgroundColor: couleurs.surface, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.bordure, padding: espacements.md },
  carteActive: { borderColor: couleurs.primaire, borderWidth: 1.5 },
  iconeBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: `${couleurs.primaire}14`, alignItems: 'center', justifyContent: 'center' },
  iconeBoxActive: { backgroundColor: couleurs.accent },
  titre: { fontSize: 16, fontWeight: '700', color: couleurs.texte },
  desc: { fontSize: 13, color: couleurs.texteSecondaire, marginTop: 2 },
  info: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm, marginTop: espacements.sm, padding: espacements.md, borderRadius: rayons.md, backgroundColor: `${couleurs.primaire}12` },
  infoTexte: { flex: 1, fontSize: 13, color: couleurs.primaire, fontWeight: '600' },
});
