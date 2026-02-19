import { FileMetadata } from '../../src/resources/FileMetadata';
import { HttpClient } from 'osf-api-v2-typescript';
import fileMetadataResponse from '../fixtures/file-metadata-response.json';
import fetchMock from 'jest-fetch-mock';

describe('FileMetadata Resource (v1 API)', () => {
  let fileMetadata: FileMetadata;
  let httpClient: HttpClient;
  const v1BaseUrl = 'https://rdm.nii.ac.jp/api/v1';

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: 'https://api.rdm.nii.ac.jp/v2/',
      token: 'dummy-token',
      allowedHosts: ['rdm.nii.ac.jp']
    });
    fileMetadata = new FileMetadata(httpClient, v1BaseUrl);
    fetchMock.resetMocks();
  });

  describe('getByProject', () => {
    it('should fetch file metadata from v1 API', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(fileMetadataResponse));

      const result = await fileMetadata.getByProject('uzdsn');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://rdm.nii.ac.jp/api/v1/project/uzdsn/metadata/project',
        expect.anything()
      );
      expect(result.data.id).toBe('uzdsn');
      expect(result.data.attributes.files).toHaveLength(2);
    });
  });

  describe('findFileByPath', () => {
    it('should find a file item by its path', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(fileMetadataResponse));

      const file = await fileMetadata.findFileByPath('uzdsn', 'osfstorage/README.md');

      expect(file).toBeDefined();
      expect(file?.path).toBe('osfstorage/README.md');
      expect(file?.folder).toBe(false);
    });

    it('should return undefined if file not found', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(fileMetadataResponse));

      const file = await fileMetadata.findFileByPath('uzdsn', 'non/existent/path');

      expect(file).toBeUndefined();
    });
  });

  describe('getActiveMetadata', () => {
    it('should return the active metadata schema for a file', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(fileMetadataResponse));

      const metadata = await fileMetadata.getActiveMetadata('uzdsn', 'osfstorage/README.md');

      expect(metadata).toBeDefined();
      expect(metadata?.schema).toBe('grdm-file-metadata-schema');
      expect(metadata?.active).toBe(true);
      expect(metadata?.['grdm-file:data-number']).toEqual({ value: 'D001', extra: [] });
    });

    it('should return undefined if no active metadata exists', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(fileMetadataResponse));

      // This file has items=[] in the fixture
      const metadata = await fileMetadata.getActiveMetadata('uzdsn', 'osfstorage/data/');

      expect(metadata).toBeUndefined();
    });

    it('should return undefined if file is not found', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(fileMetadataResponse));

      const metadata = await fileMetadata.getActiveMetadata('uzdsn', 'non/existent');

      expect(metadata).toBeUndefined();
    });
  });
});
