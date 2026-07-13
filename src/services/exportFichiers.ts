/**
 * Écriture et partage des fichiers exportés (PDF, Excel).
 * PDF : rendu HTML via expo-print. Excel : le HTML (tableaux) est enregistré en
 * .xls (Excel lit le HTML) puis partagé. Partage via expo-sharing.
 */
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

async function partager(uri: string, mimeType: string, uti: string) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, UTI: uti });
  }
}

/** Génère un PDF depuis le HTML et propose le partage. */
export async function exporterPDF(html: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  await partager(uri, 'application/pdf', 'com.adobe.pdf');
}

/** Enregistre le HTML en fichier .xls (Excel) et propose le partage. */
export async function exporterExcel(html: string, nomFichier: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${nomFichier}.xls`;
  await FileSystem.writeAsStringAsync(uri, html, { encoding: FileSystem.EncodingType.UTF8 });
  await partager(uri, 'application/vnd.ms-excel', 'com.microsoft.excel.xls');
}
