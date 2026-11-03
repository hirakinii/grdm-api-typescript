import {
  GrdmRegisteredMeta,
  GrdmRegisteredFile,
  GrdmFileMetadataField,
  GrdmCreator,
  GrdmPersonName,
  GrdmPerson,
} from '../../src/types/project-metadata';

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
    expect(meta.grdmFiles?.[0].metadata['grdm-file:title-ja'].value).toBe('タイトル');
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
