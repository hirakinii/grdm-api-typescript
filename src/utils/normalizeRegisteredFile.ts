import { GrdmFileMetadataFields, GrdmRegisteredFileMetadataFields } from '../types/file-metadata';
import {
  GrdmCreator,
  GrdmFileMetadataField,
  GrdmPerson,
  GrdmPersonName,
  GrdmRegisteredFile,
} from '../types/project-metadata';

/**
 * Type guard for the legacy `creators` / `authors` entry (`name_ja` / `name_en` string keys),
 * which can still appear in `grdm-files` snapshots of draft registrations / registrations.
 *
 * @param person - An entry of `grdm-file:creators` or `grdm-file:authors` in a snapshot
 * @returns true when the entry uses the legacy shape
 */
export function isLegacyCreator(person: GrdmPerson | GrdmCreator): person is GrdmCreator {
  return !('name-ja' in person) && !('name-en' in person) && ('name_ja' in person || 'name_en' in person);
}

/**
 * Convert a legacy or current person name to the current shape.
 * - `GrdmPersonName` is returned as a copy.
 * - A non-empty string is stored whole in `last` (not split), which matches how GRDM stores names.
 * - An empty or blank string, `null` and `undefined` become `null` (an unset person).
 *
 * @param name - A person name from a snapshot
 * @returns The name in the current shape, or null when unset
 */
export function normalizePersonName(name: GrdmPersonName | string | null | undefined): GrdmPersonName | null {
  if (name === null || name === undefined) {
    return null;
  }
  if (typeof name === 'string') {
    const trimmed = name.trim();
    return trimmed === '' ? null : { last: trimmed, middle: '', first: '' };
  }
  return { last: name.last, middle: name.middle, first: name.first };
}

/**
 * Convert a legacy `creators` / `authors` entry to `GrdmPerson`. A current entry is copied.
 *
 * @param person - An entry of `grdm-file:creators` or `grdm-file:authors` in a snapshot
 * @returns The entry in the current shape
 */
export function normalizePerson(person: GrdmPerson | GrdmCreator): GrdmPerson {
  if (isLegacyCreator(person)) {
    return {
      number: person.number,
      'name-ja': normalizePersonName(person.name_ja),
      'name-en': normalizePersonName(person.name_en),
    };
  }
  return {
    ...person,
    'name-ja': normalizePersonName(person['name-ja']),
    'name-en': normalizePersonName(person['name-en']),
  };
}

/** Copy a metadata wrapper with a new value, keeping `extra` and `comments` (when present). */
function withValue<T>(field: GrdmFileMetadataField<unknown>, value: T): GrdmFileMetadataField<T> {
  const copied: GrdmFileMetadataField<T> = { value, extra: [...field.extra] };
  if (field.comments !== undefined) {
    copied.comments = [...field.comments];
  }
  return copied;
}

/** Normalize a `creators` / `authors` wrapper; null stays null. */
function normalizePersonList(
  field: GrdmFileMetadataField<Array<GrdmPerson | GrdmCreator> | null>,
): GrdmFileMetadataField<GrdmPerson[] | null> {
  return withValue(field, field.value === null ? null : field.value.map(normalizePerson));
}

/**
 * Return a copy of a Public Funding `grdm-files` snapshot entry whose person-name fields
 * (`data-man-name-ja/en`, `creators`, `authors`) use the current shape, typed as
 * `GrdmFileMetadataFields`. Other fields are copied unchanged, absent keys stay absent,
 * and the input is not mutated.
 *
 * @param file - A snapshot entry from `GrdmRegisteredMeta.grdmFiles`
 * @returns A new snapshot entry in the current shape
 */
export function normalizeRegisteredFile(
  file: GrdmRegisteredFile<GrdmRegisteredFileMetadataFields>,
): GrdmRegisteredFile<GrdmFileMetadataFields> {
  const {
    'grdm-file:data-man-name-ja': nameJa,
    'grdm-file:data-man-name-en': nameEn,
    'grdm-file:creators': creators,
    'grdm-file:authors': authors,
    ...otherFields
  } = file.metadata;

  const metadata: GrdmFileMetadataFields = structuredClone(otherFields);
  if (nameJa) {
    metadata['grdm-file:data-man-name-ja'] = withValue(nameJa, normalizePersonName(nameJa.value));
  }
  if (nameEn) {
    metadata['grdm-file:data-man-name-en'] = withValue(nameEn, normalizePersonName(nameEn.value));
  }
  if (creators) {
    metadata['grdm-file:creators'] = normalizePersonList(creators);
  }
  if (authors) {
    metadata['grdm-file:authors'] = normalizePersonList(authors);
  }

  return { ...file, metadata };
}
