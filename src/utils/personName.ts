import { GrdmPersonName } from '../types/project-metadata';

/** Language of a person name, which determines the order of its parts. */
export type PersonNameLanguage = 'ja' | 'en';

/** Separator between name parts. In JavaScript, `\s` also matches the full-width space (U+3000). */
const NAME_SEPARATOR = /\s+/;

/**
 * Format a GRDM person name for display. Empty parts are skipped.
 * - `ja`: "last middle first"
 * - `en`: "first middle last"
 *
 * Returns "" for `null` / `undefined`. A string (the legacy shape still found in
 * `grdm-files` snapshots of draft registrations) is returned trimmed as-is.
 *
 * @param name - Structured name from GRDM file metadata, or a legacy string
 * @param lang - Language that determines the order of the parts
 * @returns The formatted name
 */
export function formatPersonName(
  name: GrdmPersonName | string | null | undefined,
  lang: PersonNameLanguage,
): string {
  if (name === null || name === undefined) {
    return '';
  }
  if (typeof name === 'string') {
    return name.trim();
  }
  const parts = lang === 'ja' ? [name.last, name.middle, name.first] : [name.first, name.middle, name.last];
  return parts
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join(' ');
}

/**
 * Split a full name into a `GrdmPersonName` for writing back to GRDM.
 * The input is split on runs of half-width or full-width whitespace.
 *
 * | Tokens | `ja`                                   | `en`                                           |
 * |--------|----------------------------------------|------------------------------------------------|
 * | 0      | all parts ""                           | all parts ""                                   |
 * | 1      | last = token                           | last = token                                   |
 * | 2      | last = t0, first = t1                  | first = t0, last = t1                          |
 * | ≥3     | last = t0, first = remaining tokens    | first = t0, middle = inner tokens, last = t[n-1] |
 *
 * Multiple tokens are joined with a single space. All three keys are always set,
 * because GRDM stores `middle` even when it is empty.
 *
 * @param fullName - Full name as entered by a user
 * @param lang - Language that determines the order of the parts
 * @returns A structured name with `last`, `first` and `middle` set
 */
export function parsePersonName(fullName: string, lang: PersonNameLanguage): GrdmPersonName {
  const tokens = fullName.trim().split(NAME_SEPARATOR).filter((token) => token !== '');

  if (tokens.length === 0) {
    return { last: '', middle: '', first: '' };
  }
  if (tokens.length === 1) {
    return { last: tokens[0], middle: '', first: '' };
  }
  if (lang === 'ja') {
    return { last: tokens[0], middle: '', first: tokens.slice(1).join(' ') };
  }
  return {
    last: tokens[tokens.length - 1],
    middle: tokens.slice(1, -1).join(' '),
    first: tokens[0],
  };
}
