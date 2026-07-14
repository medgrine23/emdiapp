/** Carte premium : surface arrondie, ombre douce, retour tactile si pressable. */
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { couleurs, espacements, ombres, rayons } from '@/theme/theme';

export function Carte({
  children,
  onPress,
  onLongPress,
  style,
  padding = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: boolean;
}) {
  const base = [styles.carte, padding && styles.padding, style];
  if (!onPress && !onLongPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [...base, pressed && styles.presse]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayons.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: couleurs.bordure,
    ...ombres.carte,
  },
  padding: { padding: espacements.md },
  presse: { opacity: 0.92, transform: [{ scale: 0.992 }] },
});
