/**
 * Champ de date réutilisable : un bouton affichant la date choisie qui ouvre un
 * calendrier natif (au lieu d'une saisie manuelle). Émet une chaîne 'AAAA-MM-JJ'.
 *
 * Sur le web (aperçu navigateur), repli sur une saisie texte, le sélecteur natif
 * n'étant pas disponible.
 */
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { couleurs, espacements, rayons } from '@/theme/theme';
import { formaterDate } from '@/utils/format';

/** Date -> 'AAAA-MM-JJ' en heure locale (évite le décalage de fuseau). */
function versChaine(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ChampDate({
  label,
  value,
  onChange,
  placeholder = 'Choisir une date',
}: {
  label?: string;
  value: string; // 'AAAA-MM-JJ' ou vide
  onChange: (valeur: string) => void;
  placeholder?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const dateCourante = value ? new Date(value) : new Date();

  if (Platform.OS === 'web') {
    return (
      <View>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
          style={styles.champ}
          value={value}
          onChangeText={onChange}
          placeholder="AAAA-MM-JJ"
        />
      </View>
    );
  }

  // Import paresseux : évite d'alourdir/charger le module natif sur le web.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DateTimePicker = require('@react-native-community/datetimepicker').default;

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.bouton} onPress={() => setOuvert(true)}>
        <Text style={[styles.valeur, !value && styles.placeholder]}>
          {value ? formaterDate(value) : placeholder}
        </Text>
        <Feather name="calendar" size={18} color={couleurs.texteSecondaire} />
      </Pressable>
      {ouvert ? (
        <DateTimePicker
          value={dateCourante}
          mode="date"
          display="default"
          onChange={(evenement: { type: string }, d?: Date) => {
            setOuvert(false);
            if (evenement.type === 'set' && d) onChange(versChaine(d));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  bouton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: couleurs.surface, borderWidth: 1, borderColor: couleurs.bordure,
    borderRadius: rayons.sm, paddingVertical: espacements.sm + 2, paddingHorizontal: espacements.sm,
  },
  valeur: { fontSize: 15, color: couleurs.texte },
  placeholder: { color: couleurs.texteSecondaire },
});
