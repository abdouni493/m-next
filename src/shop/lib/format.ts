const nf = new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 });

/** 12500 → "12 500 DA" */
export const formatDA = (value: number | null | undefined): string =>
  `${nf.format(Math.round(Number(value) || 0)).replace(/ | /g, ' ')} DA`;

export const hasPrice = (value: number | null | undefined): boolean => Number(value) > 0;

export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/** Removes emoji / pictographs and decorative bullets from a string. */
export const stripEmoji = (text: string): string =>
  text
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/[⸻—–]{2,}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Algerian mobile: accepts 05/06/07…, +213…, 00213… → returns "0XXXXXXXXX" or null. */
export const normalizeDzPhone = (raw: string): string | null => {
  let v = raw.replace(/[\s.()-]/g, '');
  if (v.startsWith('+213')) v = '0' + v.slice(4);
  else if (v.startsWith('00213')) v = '0' + v.slice(5);
  else if (v.startsWith('213') && v.length === 12) v = '0' + v.slice(3);
  return /^0(5|6|7)\d{8}$/.test(v) ? v : null;
};
