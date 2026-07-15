/**
 * Initialisation Supabase (client Expo / React Native).
 *
 * Les valeurs sont lues depuis les variables d'environnement `EXPO_PUBLIC_*`
 * (voir `.env.example`). Le client n'est créé QUE si l'URL et la clé publique
 * (« anon ») sont renseignées ; sinon les exports restent indéfinis et l'app
 * reste en mode démo (mémoire) ou Firestore.
 *
 * Modèle white-label : 1 projet Supabase = 1 entreprise. La clé « anon » est
 * publique (destinée au client) — la sécurité repose sur les règles RLS
 * définies dans `supabase/schema.sql`. Ne jamais embarquer la clé « service_role ».
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Vrai si un projet Supabase est configuré (bascule le stockage vers Supabase). */
export const supabaseConfigure = Boolean(url && anon);

export const supabase = (
  supabaseConfigure
    ? createClient(url as string, anon as string, {
        auth: {
          // L'authentification Supabase sera branchée dans un second temps.
          // Pour l'instant on n'utilise que la base de données + le temps réel.
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : undefined
) as SupabaseClient;

/** Nom de la table unique qui stocke toutes les entités (voir schema.sql). */
export const TABLE_ENTITES = 'entites';
