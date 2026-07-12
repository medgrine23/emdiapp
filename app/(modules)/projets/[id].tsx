import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BadgeEtat } from '@/components/BadgeEtat';
import { ModalAnnulation } from '@/components/ModalAnnulation';
import { useDocument } from '@/hooks/useRepository';
import { clientsRepo, LIBELLE_STATUT_PROJET, projetsRepo } from '@/services/projetService';
import { UTILISATEUR_COURANT_ID } from '@/services/session';
import { couleurs, espacements, rayons } from '@/theme/theme';
import { EtatEntite } from '@/types/models';
import { formaterDate, formaterMontant } from '@/utils/format';

export default function DetailProjet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { item: projet, chargement } = useDocument(projetsRepo, id);
  const { item: client } = useDocument(clientsRepo, projet?.clientId);
  const [modalAnnul, setModalAnnul] = useState(false);

  if (chargement) return <Message texte="Chargement…" />;
  if (!projet) return <Message texte="Projet introuvable." />;

  const actif = projet.etat === EtatEntite.Actif;
  const u = UTILISATEUR_COURANT_ID;

  const confirmer = (titre: string, message: string, action: () => Promise<void>) =>
    Alert.alert(titre, message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: () => {
          action().then(() => router.back());
        },
      },
    ]);

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: projet.reference }} />

      <View style={styles.enTete}>
        <Text style={styles.nom}>{projet.nom}</Text>
        <BadgeEtat etat={projet.etat} />
      </View>
      {projet.description ? <Text style={styles.desc}>{projet.description}</Text> : null}

      {projet.annulation ? (
        <View style={styles.encartAnnul}>
          <Text style={styles.encartTitre}>Annulé</Text>
          <Text style={styles.encartTexte}>Motif : {projet.annulation.motif}</Text>
        </View>
      ) : null}

      <Section titre="Informations">
        <Champ label="Référence" valeur={projet.reference} />
        <Champ label="Client" valeur={client?.nom ?? '—'} />
        <Champ label="Statut" valeur={LIBELLE_STATUT_PROJET[projet.statut]} />
        <Champ label="Budget alloué" valeur={formaterMontant(projet.budgetAlloue)} />
      </Section>

      <Section titre="Localisation">
        <Champ label="Adresse" valeur={projet.localisation.adresse} />
        <Champ label="Ville" valeur={projet.localisation.ville ?? '—'} />
        <Champ label="Code postal" valeur={projet.localisation.codePostal ?? '—'} />
      </Section>

      <Section titre="Échéancier">
        <Champ label="Début prévu" valeur={formaterDate(projet.dateDebutPrev)} />
        <Champ label="Fin prévue" valeur={formaterDate(projet.dateFinPrev)} />
      </Section>

      <Section titre="Actions">
        <View style={styles.actions}>
          <Bouton
            label="Modifier"
            couleur={couleurs.primaireClair}
            desactive={!actif}
            onPress={() => router.push(`/(modules)/projets/formulaire?id=${projet.id}`)}
          />
          <Bouton
            label="Archiver"
            couleur={couleurs.texteSecondaire}
            desactive={!actif}
            onPress={() =>
              confirmer('Archiver', 'Passer ce projet en lecture seule ?', () =>
                projetsRepo.archiver(projet.id, u)
              )
            }
          />
          <Bouton
            label="Annuler"
            couleur={couleurs.danger}
            desactive={!actif}
            onPress={() => setModalAnnul(true)}
          />
          <Bouton
            label="Supprimer"
            couleur={couleurs.alerte}
            desactive={projet.etat === EtatEntite.Supprime}
            onPress={() =>
              confirmer('Supprimer', 'Supprimer ce projet (soft-delete) ?', () =>
                projetsRepo.supprimer(projet.id, u)
              )
            }
          />
        </View>
      </Section>

      <ModalAnnulation
        visible={modalAnnul}
        onAnnuler={() => setModalAnnul(false)}
        onConfirmer={(motif) => {
          setModalAnnul(false);
          projetsRepo.annuler(projet.id, motif, u).then(() => router.back());
        }}
      />
    </ScrollView>
  );
}

function Message({ texte }: { texte: string }) {
  return (
    <View style={styles.centre}>
      <Text style={{ color: couleurs.texteSecondaire }}>{texte}</Text>
    </View>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitre}>{titre}</Text>
      <View style={styles.carte}>{children}</View>
    </View>
  );
}

function Champ({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.champ}>
      <Text style={styles.champLabel}>{label}</Text>
      <Text style={styles.champValeur}>{valeur}</Text>
    </View>
  );
}

function Bouton({
  label,
  couleur,
  onPress,
  desactive,
}: {
  label: string;
  couleur: string;
  onPress: () => void;
  desactive?: boolean;
}) {
  return (
    <Pressable
      style={[styles.bouton, { borderColor: couleur }, desactive && styles.boutonDesactive]}
      onPress={onPress}
      disabled={desactive}
    >
      <Text style={[styles.boutonTexte, { color: desactive ? couleurs.bordure : couleur }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: espacements.md, paddingBottom: espacements.xl },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: couleurs.fond },
  enTete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nom: { fontSize: 22, fontWeight: '700', color: couleurs.texte, flex: 1, marginRight: espacements.sm },
  desc: { fontSize: 14, color: couleurs.texteSecondaire, marginTop: espacements.xs },
  encartAnnul: {
    backgroundColor: `${couleurs.danger}10`,
    borderColor: couleurs.danger,
    borderWidth: 1,
    borderRadius: rayons.sm,
    padding: espacements.sm,
    marginTop: espacements.md,
  },
  encartTitre: { color: couleurs.danger, fontWeight: '700' },
  encartTexte: { color: couleurs.texte, marginTop: 2 },
  section: { marginTop: espacements.lg },
  sectionTitre: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: couleurs.primaire,
    marginBottom: espacements.sm,
  },
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayons.md,
    borderWidth: 1,
    borderColor: couleurs.bordure,
    padding: espacements.md,
  },
  champ: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  champLabel: { color: couleurs.texteSecondaire, fontSize: 14 },
  champValeur: { color: couleurs.texte, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  bouton: {
    borderWidth: 1.5,
    borderRadius: rayons.sm,
    paddingVertical: espacements.sm,
    paddingHorizontal: espacements.md,
  },
  boutonDesactive: { borderColor: couleurs.bordure },
  boutonTexte: { fontWeight: '700', fontSize: 14 },
});
