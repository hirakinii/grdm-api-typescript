import { GrdmFileMetadataResponse } from '../../src/types/file-metadata';
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
                  'grdm-file:title-ja': {
                    value: 'タイトル',
                    extra: []
                  },
                  'grdm-file:creators': {
                    value: [
                      { number: '123', nameJa: '氏名', nameEn: 'Name' }
                    ],
                    extra: []
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
    expect(file.items[0]['grdm-file:title-ja']?.value).toBe('タイトル');
    const creators = file.items[0]['grdm-file:creators']?.value as GrdmCreator[];
    expect(creators[0].nameJa).toBe('氏名');
  });
});
