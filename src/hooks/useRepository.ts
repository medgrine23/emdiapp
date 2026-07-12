/** Hooks React pour consommer un repository de manière réactive. */
import { useEffect, useState } from 'react';

import { OptionsListe, Repository } from '@/services/repository';
import { EntiteBase, ID } from '@/types/models';

/** Liste réactive : se met à jour automatiquement à chaque mutation. */
export function useCollection<T extends EntiteBase>(
  repo: Repository<T>,
  options?: OptionsListe
): { items: T[]; chargement: boolean } {
  const [items, setItems] = useState<T[]>([]);
  const [chargement, setChargement] = useState(true);

  // On sérialise les options pour stabiliser la dépendance de l'effet.
  const cle = JSON.stringify(options ?? {});

  useEffect(() => {
    const off = repo.souscrire((next) => {
      setItems(next);
      setChargement(false);
    }, options);
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, cle]);

  return { items, chargement };
}

/** Document unique réactif. */
export function useDocument<T extends EntiteBase>(
  repo: Repository<T>,
  id: ID | undefined
): { item: T | null; chargement: boolean } {
  const [item, setItem] = useState<T | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setChargement(false);
      return;
    }
    // Réutilise l'abonnement collection et filtre l'id voulu.
    const off = repo.souscrire((items) => {
      setItem(items.find((it) => it.id === id) ?? null);
      setChargement(false);
    }, { inclureSupprimes: true });
    return off;
  }, [repo, id]);

  return { item, chargement };
}
