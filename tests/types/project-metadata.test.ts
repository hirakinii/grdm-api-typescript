import {
  GrdmRegisteredMeta,
  GrdmRegisteredFile,
  GrdmFileMetadataField,
  GrdmCreator,
  GrdmPersonName,
  GrdmPerson,
} from '../../src/types/project-metadata';
import { GrdmFileMetadataFields, GrdmRegisteredFileMetadataFields } from '../../src/types/file-metadata';
import { Ms2MibyoDbMetadataFields, Ms2ProjectRegisteredMeta } from '../../src/types/ms2-mibyodb-metadata';

describe('grdm-files snapshot types', () => {
  const legacyFields: GrdmRegisteredFileMetadataFields = {
    'grdm-file:title-ja': { value: 'タイトル', extra: [], comments: [] },
    'grdm-file:data-man-name-ja': { value: '山田太郎', extra: [], comments: [] },
    'grdm-file:data-man-name-en': { value: '', extra: [], comments: [] },
    'grdm-file:creators': {
      value: [{ number: '12345', name_ja: '山田太郎', name_en: 'Taro Yamada' }],
      extra: [],
      comments: [],
    },
  };

  const currentFields: GrdmRegisteredFileMetadataFields = {
    'grdm-file:data-man-name-ja': { value: { last: '山田太郎', middle: '', first: '' }, extra: [], comments: [] },
    'grdm-file:creators': {
      value: [
        {
          number: '12345',
          'name-ja': { last: '山田太郎', middle: '', first: '' },
          'name-en': null,
        },
      ],
      extra: [],
      comments: [],
    },
    'grdm-file:authors': {
      value: [{ number: '1', name_ja: '山田太郎', name_en: null }],
      extra: [],
      comments: [],
    },
  };

  it('should accept both the legacy and the current person-name shapes', () => {
    expect(legacyFields['grdm-file:data-man-name-ja']?.value).toBe('山田太郎');
    expect(currentFields['grdm-file:creators']?.value?.[0]).toBeDefined();
  });

  it('should require narrowing before reading current-shape keys of a creators entry', () => {
    const entry = legacyFields['grdm-file:creators']!.value![0];
    // @ts-expect-error the entry may be a legacy GrdmCreator without 'name-ja'
    const nameJa: GrdmPersonName | null = entry['name-ja'];
    expect(nameJa).toBeUndefined();
  });

  it('should reject a number for a string field', () => {
    const fields: GrdmRegisteredFileMetadataFields = {
      // @ts-expect-error a number is not a string field value
      'grdm-file:title-ja': { value: 1, extra: [] },
    };
    expect(fields).toBeDefined();
  });

  it('should not be assignable to GrdmFileMetadataFields without normalization', () => {
    // @ts-expect-error legacy person-name shapes are not GrdmFileMetadataFields
    const fields: GrdmFileMetadataFields = legacyFields;
    expect(fields).toBeDefined();
  });

  it('should type grdmFiles of the public funding schema with the snapshot fields', () => {
    const meta: GrdmRegisteredMeta = {
      schemaType: 'public-funding',
      grdmFiles: [{ path: 'osfstorage/a', urlpath: '/a/', folder: false, metadata: legacyFields }],
    };
    const metadata: GrdmRegisteredFileMetadataFields | undefined = meta.grdmFiles?.[0].metadata;
    expect(metadata).toBe(legacyFields);
    expect(meta.grdmFiles?.[0].folder).toBe(false);
  });

  it('should type grdmFiles of the MS2 schema with the MS2 fields', () => {
    const meta: Ms2ProjectRegisteredMeta = {
      schemaType: 'ms2-mibyodb',
      grdmFiles: [
        {
          path: 'osfstorage/b',
          urlpath: '/b/',
          metadata: { 'grdm-file:d-msr-remarks-jp': { value: '備考', extra: [], comments: [] } },
        },
      ],
    };
    const metadata: Ms2MibyoDbMetadataFields | undefined = meta.grdmFiles?.[0].metadata;
    expect(metadata?.['grdm-file:d-msr-remarks-jp']?.value).toBe('備考');
  });

  it('should keep an untyped record when no type argument is given', () => {
    const file: GrdmRegisteredFile = { path: 'p', urlpath: 'u', metadata: { 'any-key': { value: 1, extra: [] } } };
    expect(file.metadata['any-key'].value).toBe(1);
  });
});

describe('GrdmPersonName / GrdmPerson', () => {
  it('should allow a GrdmPersonName with all three parts', () => {
    const name: GrdmPersonName = { last: 'Yamada', middle: '', first: 'Taro' };
    expect(name.last).toBe('Yamada');
  });

  it('should require last, first and middle on GrdmPersonName', () => {
    // @ts-expect-error middle is missing
    const name: GrdmPersonName = { last: 'Yamada', first: 'Taro' };
    expect(name.last).toBe('Yamada');
  });

  it('should allow a creators entry without affiliation keys', () => {
    const person: GrdmPerson = {
      number: '12345',
      'name-ja': { last: '山田太郎', middle: '', first: '' },
      'name-en': { last: 'Taro Yamada', middle: '', first: '' },
    };
    expect(person['name-ja']?.last).toBe('山田太郎');
    expect(person['affiliation-name-ja']).toBeUndefined();
  });

  it('should allow an authors entry with a null name and affiliation keys', () => {
    const person: GrdmPerson = {
      number: '',
      'name-ja': null,
      'name-en': { last: 'Doe', middle: 'Q.', first: 'John' },
      'affiliation-name-ja': '',
      'affiliation-name-en': 'Example University',
    };
    expect(person['name-ja']).toBeNull();
    expect(person['affiliation-name-en']).toBe('Example University');
  });

  it('should reject the legacy underscore keys on GrdmPerson', () => {
    const person: GrdmPerson = {
      number: '1',
      'name-ja': null,
      'name-en': null,
      // @ts-expect-error name_ja is not a key of GrdmPerson
      name_ja: '山田太郎',
    };
    expect(person.number).toBe('1');
  });
});

describe('GrdmFileMetadataField generic', () => {
  it('should default the value type to unknown', () => {
    const field: GrdmFileMetadataField = { value: { any: 'shape' }, extra: [] };
    expect(field.value).toEqual({ any: 'shape' });
  });

  it('should constrain the value type when a type argument is given', () => {
    const field: GrdmFileMetadataField<string | null> = { value: 'text', extra: [], comments: [] };
    const text: string | null = field.value;
    expect(text).toBe('text');
    // @ts-expect-error a number is not assignable to string | null
    const invalid: GrdmFileMetadataField<string | null> = { value: 1, extra: [] };
    expect(invalid.value).toBe(1);
  });
});

describe('ProjectMetadata Types', () => {
  it('should allow valid GrdmRegisteredMeta object', () => {
    const meta: GrdmRegisteredMeta = {
      schemaType: 'public-funding',
      funder: 'JSPS',
      programNameJa: '科学研究費助成事業',
      grdmFiles: [
        {
          path: 'osfstorage/README.md',
          urlpath: '/uzdsn/files/',
          metadata: {
            'grdm-file:title-ja': {
              value: 'タイトル',
              extra: []
            }
          }
        }
      ]
    };
    expect(meta.funder).toBe('JSPS');
    expect(meta.grdmFiles?.[0].path).toBe('osfstorage/README.md');
    expect(meta.grdmFiles?.[0].metadata['grdm-file:title-ja']?.value).toBe('タイトル');
  });

  it('should allow creators in metadata', () => {
    const creators: GrdmCreator[] = [
      { number: '123', name_ja: '氏名', name_en: 'Name' }
    ];
    const file: GrdmRegisteredFile = {
      path: 'test',
      urlpath: 'test',
      metadata: {
        'grdm-file:creators': {
          value: creators,
          extra: []
        }
      }
    };
    expect(file.metadata['grdm-file:creators'].value).toEqual(creators);
  });

  it('should allow valid GrdmCreator object', () => {
    const creator: GrdmCreator = {
      number: '12345',
      name_ja: '山田 太郎',
      name_en: 'Taro Yamada'
    };
    expect(creator.name_ja).toBe('山田 太郎');
  });
});
