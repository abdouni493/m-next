import { DESCRIPTION_NOISE } from '../storeConfig';
import { stripEmoji } from './format';

export interface DescriptionSection {
  title: string;
  kind: 'compat' | 'features' | 'safety' | 'other';
  items: string[];
  text: string[];
}

export interface ParsedDescription {
  intro: string[];
  sections: DescriptionSection[];
  compatibleModels: string[];
}

const BULLET = /^\s*(?:[•●▪◦·*\-–]|✔️?|✅|☑️?|✓|➤|►|→|\d+[.)])\s*/u;
const SEPARATOR = /^\s*(?:⸻|—{2,}|-{3,}|_{3,}|={3,})\s*$/;

const kindOf = (title: string): DescriptionSection['kind'] => {
  const t = title.toLowerCase();
  if (/compatib|modèle|models?|convient/.test(t)) return 'compat';
  if (/sécurit|securit|protection/.test(t)) return 'safety';
  if (/caract|spécif|specif|fiche|technique/.test(t)) return 'features';
  return 'other';
};

const isNoise = (line: string) => DESCRIPTION_NOISE.some((re) => re.test(line));

/**
 * Turns the raw admin description (emojis, "•", "✔️", "⸻", repeated phone footer)
 * into clean sections. The repeated marketing/contact footer is dropped.
 */
export function parseDescription(raw?: string | null): ParsedDescription {
  const result: ParsedDescription = { intro: [], sections: [], compatibleModels: [] };
  if (!raw) return result;

  const lines = raw
    .replace(/\r/g, '')
    // inline bullets ("a • b • c") → one per line
    .replace(/\s+[•●▪]\s+/g, '\n• ')
    .split('\n');

  let current: DescriptionSection | null = null;

  for (const rawLine of lines) {
    if (SEPARATOR.test(rawLine)) { current = null; continue; }
    if (isNoise(rawLine)) continue;
    const isBullet = BULLET.test(rawLine);
    const line = stripEmoji(rawLine.replace(BULLET, '')).replace(/^[:\s]+/, '');
    if (!line) continue;

    const looksLikeHeading = !isBullet && (/:\s*$/.test(line) || (line.length < 48 && /^[A-ZÉÈÀ]/.test(line) && kindOf(line) !== 'other'));
    if (looksLikeHeading) {
      const title = line.replace(/:\s*$/, '');
      current = { title, kind: kindOf(title), items: [], text: [] };
      result.sections.push(current);
      continue;
    }

    if (current) {
      if (isBullet) current.items.push(line);
      else current.text.push(line);
    } else if (isBullet) {
      current = { title: 'Caractéristiques', kind: 'features', items: [line], text: [] };
      result.sections.push(current);
    } else {
      result.intro.push(line);
    }
  }

  result.sections = result.sections.filter((s) => s.items.length || s.text.length);
  const compat = result.sections.filter((s) => s.kind === 'compat');
  result.compatibleModels = compat
    .flatMap((s) => [...s.items, ...s.text])
    .flatMap((l) => l.split(/[,;/]| et /))
    .map((m) => m.trim())
    .filter((m) => m.length > 1 && m.length < 60);

  return result;
}

/** First meaningful sentence, for meta descriptions. */
export const summarize = (raw?: string | null, max = 155): string => {
  const p = parseDescription(raw);
  const text = [...p.intro, ...p.sections.flatMap((s) => s.items)].join(' · ');
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
};
