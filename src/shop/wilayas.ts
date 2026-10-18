import { getMunicipalitiesForWilaya } from '@/data/algerian-municipalities';

/**
 * The 69 wilayas, numbered. Names for 01–58 match the keys used by the admin
 * delivery-price tables, so price lookups keep working.
 */
export const WILAYAS: { code: string; name: string }[] = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
  'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
  'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', "M'Sila", 'Mascara', 'Ouargla',
  'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar',
  'Ouled Djellal', 'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El Meghaier', 'El Menia',
  // Wilayas created in 2025 (codes 59–69)
  'Aflou', 'Barika', 'El Kantara', 'Bir El Ater', 'El Aricha', 'Ksar Chellala', 'Aïn Oussara', 'Messaad',
  'Ksar El Boukhari', 'Bou Saâda', 'El Abiodh Sidi Cheikh',
].map((name, i) => ({ code: String(i + 1).padStart(2, '0'), name }));

/** Communes for a wilaya; new wilayas have none yet → free-text input. */
export const communesFor = (wilaya: string): string[] => getMunicipalitiesForWilaya(wilaya);
