import { GrdmFileMetadataResponse, GrdmFileMetadataSchema } from '../../src/types/file-metadata';
import { GrdmCreator } from '../../src/types/project-metadata';

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
                  schema: 'schema_id',
                  active: true,
                  data: {
                    'grdm-file:title-ja': {
                      value: 'タイトル',
                      extra: []
                    },
                    'grdm-file:creators': {
                      value: [
                        { number: '123', name_ja: '氏名', name_en: 'Name' }
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
    expect(file.items[0].data['grdm-file:title-ja']?.value).toBe('タイトル');
    const creators = file.items[0].data['grdm-file:creators']?.value as GrdmCreator[];
    expect(creators[0].name_ja).toBe('氏名');
  });

  it('reads metadata fields from the data property', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: 'some-schema-id',
      active: true,
      data: {
        'grdm-file:title-ja': { value: 'Test Title', extra: [], comments: [] },
      },
    };
    expect(schema.data['grdm-file:title-ja']?.value).toBe('Test Title');
  });

  it('should allow new manuscript and dataset metadata fields', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: 'some-schema-id',
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
  });
});
