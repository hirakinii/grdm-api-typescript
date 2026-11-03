import {
  GrdmFileMetadataFields,
  GrdmFileMetadataResponse,
  GrdmFileMetadataSchema,
  isPublicFundingSchema,
  SCHEMA_ID_PUBLIC_FUNDING,
  SCHEMA_ID_MS2_MIBYODB,
} from '../../src/types/file-metadata';
import { GrdmPerson, GrdmPersonName } from '../../src/types/project-metadata';

describe('GrdmFileMetadataFields person-name typing', () => {
  const datasetFields: GrdmFileMetadataFields = {
    'grdm-file:data-man-name-ja': { value: { last: '山田太郎', middle: '', first: '' }, extra: [], comments: [] },
    'grdm-file:data-man-name-en': { value: { last: 'Taro Yamada', middle: '', first: '' }, extra: [], comments: [] },
    'grdm-file:data-man-email': { value: 'yamada@example.com', extra: [], comments: [] },
    'grdm-file:creators': {
      value: [
        {
          number: '12345',
          'name-ja': { last: '山田太郎', middle: '', first: '' },
          'name-en': { last: 'Taro Yamada', middle: '', first: '' },
        },
      ],
      extra: [],
      comments: [],
    },
    'grdm-file:authors': { value: null, extra: [], comments: [] },
  };

  it('should type data-man-name-* as GrdmPersonName | null', () => {
    const name: GrdmPersonName | null | undefined = datasetFields['grdm-file:data-man-name-ja']?.value;
    expect(name?.last).toBe('山田太郎');
  });

  it('should type creators and authors as GrdmPerson[] | null', () => {
    const creators: GrdmPerson[] | null | undefined = datasetFields['grdm-file:creators']?.value;
    const authors: GrdmPerson[] | null | undefined = datasetFields['grdm-file:authors']?.value;
    expect(creators?.[0]['name-en']?.last).toBe('Taro Yamada');
    expect(authors).toBeNull();
  });

  it('should type other fields as string | null', () => {
    const email: string | null | undefined = datasetFields['grdm-file:data-man-email']?.value;
    expect(email).toBe('yamada@example.com');
  });

  it('should allow authors entries with a null name and affiliation keys', () => {
    const fields: GrdmFileMetadataFields = {
      'grdm-file:authors': {
        value: [
          {
            number: '',
            'name-ja': null,
            'name-en': { last: 'Doe', middle: '', first: 'John' },
            'affiliation-name-ja': '',
            'affiliation-name-en': 'Example University',
          },
        ],
        extra: [],
        comments: [],
      },
    };
    expect(fields['grdm-file:authors']?.value?.[0]['name-ja']).toBeNull();
  });

  it('should reject shapes that do not match the GRDM data', () => {
    const fields: GrdmFileMetadataFields = {
      // @ts-expect-error a plain string is not a GrdmPersonName
      'grdm-file:data-man-name-ja': { value: '山田太郎', extra: [] },
      'grdm-file:creators': {
        // @ts-expect-error the legacy underscore keys are not GrdmPerson
        value: [{ number: '1', name_ja: '山田太郎', name_en: 'Taro Yamada' }],
        extra: [],
      },
      // @ts-expect-error a number is not a string field value
      'grdm-file:title-ja': { value: 1, extra: [] },
    };
    expect(fields).toBeDefined();
  });

  it('should not allow assigning a person name to a string', () => {
    // @ts-expect-error GrdmPersonName | null is not assignable to string
    const text: string = datasetFields['grdm-file:data-man-name-ja']!.value;
    expect(text).toBeDefined();
  });
});

describe('FileMetadata Types', () => {
  it('should allow valid GrdmFileMetadataResponse object', () => {
    const response: GrdmFileMetadataResponse = {
      data: {
        id: 'project_id',
        type: 'project-metadata',
        attributes: {
          editable: true,
          features: {
            sharing: true
          },
          files: [
            {
              path: 'osfstorage/README.md',
              hash: 'hash',
              folder: false,
              urlpath: '/url/path/',
              generated: false,
              items: [
                {
                  schema: SCHEMA_ID_PUBLIC_FUNDING,
                  active: true,
                  data: {
                    'grdm-file:title-ja': {
                      value: 'タイトル',
                      extra: []
                    },
                    'grdm-file:creators': {
                      value: [
                        {
                          number: '123',
                          'name-ja': { last: '氏名', middle: '', first: '' },
                          'name-en': { last: 'Name', middle: '', first: '' },
                        }
                      ],
                      extra: []
                    }
                  }
                }
              ]
            }
          ]
        }
      }
    };
    expect(response.data.id).toBe('project_id');
    const file = response.data.attributes.files[0];
    expect(file.path).toBe('osfstorage/README.md');

    const schema = file.items[0];
    if (isPublicFundingSchema(schema)) {
      expect(schema.data['grdm-file:title-ja']?.value).toBe('タイトル');
      const creators = schema.data['grdm-file:creators']?.value;
      expect(creators?.[0]['name-ja']?.last).toBe('氏名');
    } else {
      throw new Error('Expected isPublicFundingSchema to return true');
    }
  });

  it('reads metadata fields from the data property after type guard', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: SCHEMA_ID_PUBLIC_FUNDING,
      active: true,
      data: {
        'grdm-file:title-ja': { value: 'Test Title', extra: [], comments: [] },
      },
    };
    if (isPublicFundingSchema(schema)) {
      expect(schema.data['grdm-file:title-ja']?.value).toBe('Test Title');
    } else {
      throw new Error('Expected isPublicFundingSchema to return true');
    }
  });

  it('should allow new manuscript and dataset metadata fields', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: SCHEMA_ID_PUBLIC_FUNDING,
      active: true,
      data: {
        'grdm-file:file-type': { value: 'dataset', extra: [], comments: [] },
        'grdm-file:doi': { value: '10.1234/example', extra: [], comments: [] },
        'grdm-file:manuscript-type': { value: 'journal article', extra: [], comments: [] },
        'grdm-file:authors': { value: null, extra: [], comments: [] },
        'grdm-file:journal-name-ja': { value: '情報処理学会論文誌', extra: [], comments: [] },
        'grdm-file:journal-name-en': { value: 'IPSJ Journal', extra: [], comments: [] },
        'grdm-file:date-published': { value: '2025-01-01', extra: [], comments: [] },
        'grdm-file:volume': { value: '66', extra: [], comments: [] },
        'grdm-file:issue': { value: '1', extra: [], comments: [] },
        'grdm-file:page-start': { value: '1', extra: [], comments: [] },
        'grdm-file:page-end': { value: '10', extra: [], comments: [] },
        'grdm-file:reviewed': { value: 'yes', extra: [], comments: [] },
        'grdm-file:version': { value: '1.0', extra: [], comments: [] },
        'grdm-file:publication-link': { value: 'https://example.com/pub', extra: [], comments: [] },
        'grdm-file:dataset-link': { value: 'https://example.com/data', extra: [], comments: [] },
      },
    };
    if (isPublicFundingSchema(schema)) {
      expect(schema.data['grdm-file:file-type']?.value).toBe('dataset');
      expect(schema.data['grdm-file:doi']?.value).toBe('10.1234/example');
      expect(schema.data['grdm-file:manuscript-type']?.value).toBe('journal article');
      expect(schema.data['grdm-file:authors']?.value).toBeNull();
      expect(schema.data['grdm-file:journal-name-ja']?.value).toBe('情報処理学会論文誌');
      expect(schema.data['grdm-file:journal-name-en']?.value).toBe('IPSJ Journal');
      expect(schema.data['grdm-file:date-published']?.value).toBe('2025-01-01');
      expect(schema.data['grdm-file:volume']?.value).toBe('66');
      expect(schema.data['grdm-file:issue']?.value).toBe('1');
      expect(schema.data['grdm-file:page-start']?.value).toBe('1');
      expect(schema.data['grdm-file:page-end']?.value).toBe('10');
      expect(schema.data['grdm-file:reviewed']?.value).toBe('yes');
      expect(schema.data['grdm-file:version']?.value).toBe('1.0');
      expect(schema.data['grdm-file:publication-link']?.value).toBe('https://example.com/pub');
      expect(schema.data['grdm-file:dataset-link']?.value).toBe('https://example.com/data');
    } else {
      throw new Error('Expected isPublicFundingSchema to return true');
    }
  });

  it('should allow GrdmFileMetadataSchema with unknown schema ID in data union', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: 'unknown-schema-id',
      active: false,
      data: {},
    };
    expect(schema.schema).toBe('unknown-schema-id');
    expect(schema.active).toBe(false);
  });

  it('SCHEMA_ID_PUBLIC_FUNDING and SCHEMA_ID_MS2_MIBYODB should be distinct', () => {
    expect(SCHEMA_ID_PUBLIC_FUNDING).not.toBe(SCHEMA_ID_MS2_MIBYODB);
  });
});
