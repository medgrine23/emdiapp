/** Bouton d'action flottant premium (ombre + retour tactile). */
import { Feather } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { couleurs, ombres } from '@/theme/theme';

type NomIcone = ComponentProps<typeof Feather>['name'];

export function Fab({
  onPress,
  icone = 'plus',
  disabled,
}: {
  onPress: () => void;
  icone?: NomIcone;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.fab, disabled && styles.off, pressed && styles.presse]}
    >
      <Feather name={icone} size={26} color={couleurs.surAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: couleurs.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...ombres.flottant,
  },
  off: { backgroundColor: couleurs.bordure },
  presse: { transform: [{ scale: 0.94 }] },
});
