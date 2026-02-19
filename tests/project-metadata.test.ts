import { GrdmRegisteredMeta, GrdmRegisteredFile, GrdmFileMetadataField, GrdmCreator } from '../src/types/project-metadata';

describe('ProjectMetadata Types', () => {
  it('should allow valid GrdmRegisteredMeta object', () => {
    const meta: GrdmRegisteredMeta = {
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
  });

  it('should allow valid GrdmCreator object', () => {
    const creator: GrdmCreator = {
      number: '12345',
      nameJa: '山田 太郎',
      nameEn: 'Taro Yamada'
    };
    expect(creator.nameJa).toBe('山田 太郎');
  });
});
