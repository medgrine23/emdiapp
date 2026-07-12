/** Utilitaires de formatage (montants, dates). */
import { Horodatage } from '@/types/models';

export function formaterMontant(valeur: number, devise = 'DZD'): string {
  const n = new Intl.NumberFormat('fr-FR').format(valeur);
  return `${n} ${devise}`;
}

export function formaterDate(iso?: Horodatage | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
