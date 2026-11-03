import {
  isLegacyCreator,
  normalizePerson,
  normalizePersonName,
  normalizeRegisteredFile,
} from '../../src/utils/normalizeRegisteredFile';
import { GrdmFileMetadataFields, GrdmRegisteredFileMetadataFields } from '../../src/types/file-metadata';
import { GrdmCreator, GrdmPerson, GrdmPersonName, GrdmRegisteredFile } from '../../src/types/project-metadata';

/** Recursively freeze an object so that any mutation throws in strict mode. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe('isLegacyCreator', () => {
  it('should return true for a legacy entry', () => {
    expect(isLegacyCreator({ number: '1', name_ja: '山田太郎', name_en: 'Taro Yamada' })).toBe(true);
  });

  it('should return true for a legacy entry whose names are null', () => {
    expect(isLegacyCreator({ number: null, name_ja: null, name_en: null })).toBe(true);
  });

  it('should return false for a current entry', () => {
    expect(isLegacyCreator({ number: '1', 'name-ja': null, 'name-en': null })).toBe(false);
  });

  it('should return false when only one hyphenated key is present', () => {
    const partial = { number: '1', 'name-en': null, name_ja: '山田太郎' } as unknown as GrdmPerson;
    expect(isLegacyCreator(partial)).toBe(false);
  });

  it('should return false when no name key is present', () => {
    expect(isLegacyCreator({ number: '1' } as unknown as GrdmCreator)).toBe(false);
  });

  it('should narrow the type', () => {
    const person: GrdmPerson | GrdmCreator = { number: '1', 'name-ja': null, 'name-en': null };
    if (!isLegacyCreator(person)) {
      const nameJa: GrdmPersonName | null = person['name-ja'];
      expect(nameJa).toBeNull();
    }
  });
});

describe('normalizePersonName', () => {
  it('should return a copy of a GrdmPersonName', () => {
    const name: GrdmPersonName = { last: '山田', middle: '', first: '太郎' };
    const result = normalizePersonName(name);
    expect(result).toEqual(name);
    expect(result).not.toBe(name);
  });

  it('should put a non-empty string into last without splitting it', () => {
    expect(normalizePersonName('Taro Yamada')).toEqual({ last: 'Taro Yamada', middle: '', first: '' });
  });

  it('should trim a string', () => {
    expect(normalizePersonName('  山田太郎 ')).toEqual({ last: '山田太郎', middle: '', first: '' });
  });

  it('should return null for an empty or blank string', () => {
    expect(normalizePersonName('')).toBeNull();
    expect(normalizePersonName(' 　 ')).toBeNull();
  });

  it('should return null for null and undefined', () => {
    expect(normalizePersonName(null)).toBeNull();
    expect(normalizePersonName(undefined)).toBeNull();
  });
});

describe('normalizePerson', () => {
  it('should convert a legacy entry with string names', () => {
    expect(normalizePerson({ number: '12345', name_ja: '山田太郎', name_en: 'Taro Yamada' })).toEqual({
      number: '12345',
      'name-ja': { last: '山田太郎', middle: '', first: '' },
      'name-en': { last: 'Taro Yamada', middle: '', first: '' },
    });
  });

  it('should convert a legacy entry with null or empty names', () => {
    expect(normalizePerson({ number: null, name_ja: null, name_en: '' })).toEqual({
      number: null,
      'name-ja': null,
      'name-en': null,
    });
  });

  it('should copy a current entry and keep its affiliations', () => {
    const person: GrdmPerson = {
      number: '',
      'name-ja': null,
      'name-en': { last: 'Doe', middle: 'Q.', first: 'John' },
      'affiliation-name-ja': '',
      'affiliation-name-en': 'Example University',
    };
    const result = normalizePerson(person);
    expect(result).toEqual(person);
    expect(result).not.toBe(person);
    expect(result['name-en']).not.toBe(person['name-en']);
  });
});

describe('normalizeRegisteredFile', () => {
  const legacyFile: GrdmRegisteredFile<GrdmRegisteredFileMetadataFields> = {
    path: 'osfstorage/legacy.txt',
    urlpath: '/legacy/',
    folder: false,
    metadata: {
      'grdm-file:title-ja': { value: 'タイトル', extra: ['x'], comments: ['c'] },
      'grdm-file:data-man-name-ja': { value: '山田太郎', extra: [], comments: [] },
      'grdm-file:data-man-name-en': { value: '', extra: ['e'], comments: [] },
      'grdm-file:creators': {
        value: [{ number: '12345', name_ja: '山田太郎', name_en: 'Taro Yamada' }],
        extra: [],
        comments: ['note'],
      },
      'grdm-file:authors': { value: null, extra: [], comments: [] },
    },
  };

  it('should convert every legacy person-name field', () => {
    const result: GrdmRegisteredFile<GrdmFileMetadataFields> = normalizeRegisteredFile(legacyFile);
    expect(result.metadata['grdm-file:data-man-name-ja']).toEqual({
      value: { last: '山田太郎', middle: '', first: '' },
      extra: [],
      comments: [],
    });
    expect(result.metadata['grdm-file:data-man-name-en']).toEqual({ value: null, extra: ['e'], comments: [] });
    expect(result.metadata['grdm-file:creators']).toEqual({
      value: [
        {
          number: '12345',
          'name-ja': { last: '山田太郎', middle: '', first: '' },
          'name-en': { last: 'Taro Yamada', middle: '', first: '' },
        },
      ],
      extra: [],
      comments: ['note'],
    });
    expect(result.metadata['grdm-file:authors']).toEqual({ value: null, extra: [], comments: [] });
  });

  it('should convert legacy entries in authors', () => {
    const file: GrdmRegisteredFile<GrdmRegisteredFileMetadataFields> = {
      path: 'p',
      urlpath: 'u',
      metadata: {
        'grdm-file:authors': { value: [{ number: '1', name_ja: null, name_en: 'John Doe' }], extra: [] },
      },
    };
    expect(normalizeRegisteredFile(file).metadata['grdm-file:authors']?.value).toEqual([
      { number: '1', 'name-ja': null, 'name-en': { last: 'John Doe', middle: '', first: '' } },
    ]);
  });

  it('should keep other fields and file keys unchanged', () => {
    const result = normalizeRegisteredFile(legacyFile);
    expect(result.path).toBe('osfstorage/legacy.txt');
    expect(result.urlpath).toBe('/legacy/');
    expect(result.folder).toBe(false);
    expect(result.metadata['grdm-file:title-ja']).toEqual({ value: 'タイトル', extra: ['x'], comments: ['c'] });
  });

  it('should not add absent keys', () => {
    const file: GrdmRegisteredFile<GrdmRegisteredFileMetadataFields> = {
      path: 'p',
      urlpath: 'u',
      metadata: { 'grdm-file:title-ja': { value: 't', extra: [] } },
    };
    const result = normalizeRegisteredFile(file);
    expect(Object.keys(result.metadata)).toEqual(['grdm-file:title-ja']);
    expect('folder' in result).toBe(false);
  });

  it('should not mutate the input', () => {
    const frozen = deepFreeze(structuredClone(legacyFile));
    expect(() => normalizeRegisteredFile(frozen)).not.toThrow();
    expect(frozen).toEqual(legacyFile);
  });

  it('should leave an already-current file deep-equal to the input', () => {
    const currentFile: GrdmRegisteredFile<GrdmRegisteredFileMetadataFields> = {
      path: 'p',
      urlpath: 'u',
      metadata: {
        'grdm-file:data-man-name-ja': { value: { last: '山田太郎', middle: '', first: '' }, extra: [], comments: [] },
        'grdm-file:data-man-name-en': { value: null, extra: [], comments: [] },
        'grdm-file:creators': {
          value: [{ number: '1', 'name-ja': { last: '山田', middle: '', first: '太郎' }, 'name-en': null }],
          extra: [],
          comments: [],
        },
      },
    };
    expect(normalizeRegisteredFile(currentFile)).toEqual(currentFile);
  });
});
