import { GrdmRegisteredMeta, GrdmRegisteredFile, GrdmFileMetadataField, GrdmCreator } from '../../src/types/project-metadata';

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
    expect(meta.grdmFiles?.[0].metadata['grdm-file:title-ja'].value).toBe('タイトル');
  });

  it('should allow creators in metadata', () => {
    const creators: GrdmCreator[] = [
      { number: '123', nameJa: '氏名', nameEn: 'Name' }
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
      nameJa: '山田 太郎',
      nameEn: 'Taro Yamada'
    };
    expect(creator.nameJa).toBe('山田 太郎');
  });
});
