import { MemoryRepository } from '@/services/repository';
import { EntiteBase, EtatEntite } from '@/types/models';

interface Item extends EntiteBase {
  nom: string;
}

const U = 'u-test';

describe('MemoryRepository — machine à états (§2)', () => {
  let repo: MemoryRepository<Item>;
  beforeEach(() => {
    repo = new MemoryRepository<Item>();
  });

  test('créer initialise l\'état actif et l\'audit', async () => {
    const item = await repo.creer({ nom: 'A' }, U);
    expect(item.id).toBeTruthy();
    expect(item.etat).toBe(EtatEntite.Actif);
    expect(item.creePar).toBe(U);
    expect(item.creeLe).toBeTruthy();
    expect(item.annulation).toBeNull();
  });

  test('modifier met à jour les champs et l\'audit', async () => {
    const item = await repo.creer({ nom: 'A' }, U);
    await repo.modifier(item.id, { nom: 'B' }, 'u2');
    const relu = await repo.lire(item.id);
    expect(relu?.nom).toBe('B');
    expect(relu?.modifiePar).toBe('u2');
  });

  test('supprimer réalise un soft-delete (conservé, masqué des listes)', async () => {
    const item = await repo.creer({ nom: 'A' }, U);
    await repo.supprimer(item.id, U);
    const relu = await repo.lire(item.id);
    expect(relu?.etat).toBe(EtatEntite.Supprime);
    expect(relu?.supprimeLe).toBeTruthy();
    expect(await repo.lister()).toHaveLength(0);
    expect(await repo.lister({ inclureSupprimes: true })).toHaveLength(1);
  });

  test('archiver passe en lecture seule et bloque la modification', async () => {
    const item = await repo.creer({ nom: 'A' }, U);
    await repo.archiver(item.id, U);
    expect((await repo.lire(item.id))?.etat).toBe(EtatEntite.Archive);
    await expect(repo.modifier(item.id, { nom: 'B' }, U)).rejects.toThrow(/archiv/i);
  });

  test('annuler exige un motif non vide et le conserve', async () => {
    const item = await repo.creer({ nom: 'A' }, U);
    await expect(repo.annuler(item.id, '   ', U)).rejects.toThrow(/motif/i);
    await repo.annuler(item.id, 'Erreur de saisie', U);
    const relu = await repo.lire(item.id);
    expect(relu?.etat).toBe(EtatEntite.Annule);
    expect(relu?.annulation?.motif).toBe('Erreur de saisie');
  });

  test('lister filtre par égalité et exclut les supprimés', async () => {
    await repo.creer({ nom: 'A' }, U);
    const b = await repo.creer({ nom: 'B' }, U);
    await repo.supprimer(b.id, U);
    const actifs = await repo.lister();
    expect(actifs.map((i) => i.nom)).toEqual(['A']);
  });

  test('souscrire notifie à chaque mutation', async () => {
    const vues: number[] = [];
    const off = repo.souscrire((items) => vues.push(items.length));
    await repo.creer({ nom: 'A' }, U);
    await repo.creer({ nom: 'B' }, U);
    off();
    expect(vues[vues.length - 1]).toBe(2);
  });
});
