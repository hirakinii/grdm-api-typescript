import { GrdmFileMetadataResponse, GrdmFileItem, GrdmFileMetadataSchema } from '../src/types/file-metadata';

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
                  active: true
                }
              ]
            }
          ]
        }
      }
    };
    expect(response.data.id).toBe('project_id');
    expect(response.data.attributes.files[0].path).toBe('osfstorage/README.md');
  });
});
