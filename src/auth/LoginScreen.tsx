/** Écran de connexion / inscription (affiché quand Firebase est configuré et
 *  qu'aucun utilisateur n'est connecté). */
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { connexion, inscription } from '@/services/authService';
import { couleurs, espacements, rayons } from '@/theme/theme';

export function LoginScreen() {
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const valider = async () => {
    setErreur(null);
    if (!email.trim() || !motDePasse) {
      setErreur('Email et mot de passe sont obligatoires.');
      return;
    }
    setChargement(true);
    try {
      if (mode === 'connexion') {
        await connexion(email.trim(), motDePasse);
      } else {
        await inscription(email.trim(), motDePasse, nom.trim() || undefined);
      }
      // La navigation se fait automatiquement via l'observateur d'état (AuthProvider).
    } catch (e) {
      setErreur(traduireErreur(e));
    } finally {
      setChargement(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.carte}>
        <Text style={styles.titre}>EMDI Chantiers</Text>
        <Text style={styles.sous}>{mode === 'connexion' ? 'Connexion' : 'Créer un compte'}</Text>

        {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

        {mode === 'inscription' ? (
          <>
            <Text style={styles.label}>Nom</Text>
            <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="Votre nom" />
          </>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.champ} value={email} onChangeText={setEmail} placeholder="email@exemple.dz" autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput style={styles.champ} value={motDePasse} onChangeText={setMotDePasse} placeholder="••••••••" secureTextEntry />

        <Pressable style={[styles.bouton, chargement && styles.boutonOff]} onPress={valider} disabled={chargement}>
          {chargement ? <ActivityIndicator color="#fff" /> : <Text style={styles.boutonTexte}>{mode === 'connexion' ? 'Se connecter' : "S'inscrire"}</Text>}
        </Pressable>

        <Pressable onPress={() => { setMode(mode === 'connexion' ? 'inscription' : 'connexion'); setErreur(null); }}>
          <Text style={styles.bascule}>
            {mode === 'connexion' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function traduireErreur(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cet email est déjà utilisé.';
    case 'auth/weak-password':
      return 'Mot de passe trop faible (6 caractères minimum).';
    case 'auth/invalid-email':
      return 'Email invalide.';
    default:
      return 'Une erreur est survenue. Réessayez.';
  }
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.primaire, justifyContent: 'center', padding: espacements.lg },
  carte: { backgroundColor: couleurs.surface, borderRadius: rayons.lg, padding: espacements.lg },
  titre: { fontSize: 24, fontWeight: '800', color: couleurs.primaire, textAlign: 'center' },
  sous: { fontSize: 15, color: couleurs.texteSecondaire, textAlign: 'center', marginTop: espacements.xs, marginBottom: espacements.md },
  erreur: { color: couleurs.danger, backgroundColor: `${couleurs.danger}10`, padding: espacements.sm, borderRadius: rayons.sm, marginBottom: espacements.sm, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.texteSecondaire, marginTop: espacements.md, marginBottom: espacements.xs },
  champ: { backgroundColor: couleurs.fond, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.sm, padding: espacements.sm, color: couleurs.texte, fontSize: 15 },
  bouton: { backgroundColor: couleurs.accent, borderRadius: rayons.md, padding: espacements.md, alignItems: 'center', marginTop: espacements.lg },
  boutonOff: { opacity: 0.7 },
  boutonTexte: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bascule: { color: couleurs.primaireClair, textAlign: 'center', marginTop: espacements.md, fontWeight: '600' },
});
