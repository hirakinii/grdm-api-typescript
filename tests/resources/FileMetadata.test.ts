import { FileMetadata } from '../../src/resources/FileMetadata';
import { HttpClient } from 'osf-api-v2-typescript';
import fileMetadataResponse from '../fixtures/file-metadata-response.json';
import ms2MibyoDbResponse from '../fixtures/ms2-mibyodb-metadata-response.json';
import fetchMock from 'jest-fetch-mock';
import { isPublicFundingSchema, isMs2MibyoDbSchema } from '../../src/types/file-metadata';

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
      expect(metadata?.schema).toBe('66d7d4ec299c4f00071be84f');
      expect(metadata?.active).toBe(true);

      if (metadata && isPublicFundingSchema(metadata)) {
        expect(metadata.data['grdm-file:data-number']).toEqual({ value: 'D001', extra: [], comments: [] });
      } else {
        throw new Error('Expected isPublicFundingSchema to return true for fixture');
      }
    });

    it('should return schema ② active metadata for a MS2 Mibyodb project file', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(ms2MibyoDbResponse));

      const fm = new FileMetadata(httpClient, v1BaseUrl);
      const metadata = await fm.getActiveMetadata('ms2db', 'osfstorage/sample.csv');

      expect(metadata).toBeDefined();
      expect(metadata?.active).toBe(true);

      if (metadata && isMs2MibyoDbSchema(metadata)) {
        expect(metadata.data['grdm-file:d-msr-object-of-measurement-jp']?.value).toBe('血圧');
        expect(metadata.data['grdm-file:d-msr-object-of-measurement-en']?.value).toBe('blood pressure');
        expect(metadata.data['grdm-file:Label-explanation']?.value).toBeNull();
      } else {
        throw new Error('Expected isMs2MibyoDbSchema to return true for MS2 Mibyodb fixture');
      }
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

describe('FileMetadata Resource — custom fetch injection', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: 'https://api.rdm.nii.ac.jp/v2/',
      token: 'dummy-token',
      allowedHosts: ['rdm.nii.ac.jp'],
    });
  });

  it('should call custom fetch instead of httpClient when provided', async () => {
    const customFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fileMetadataResponse),
    });
    const fm = new FileMetadata(
      httpClient,
      '/proxy-v1',
      customFetch as unknown as typeof fetch,
      () => 'proxy-token',
    );

    const result = await fm.getByProject('uzdsn');

    expect(customFetch).toHaveBeenCalledTimes(1);
    expect(result.data.id).toBe('uzdsn');
  });

  it('should call custom fetch with the correct URL', async () => {
    const customFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fileMetadataResponse),
    });
    const fm = new FileMetadata(
      httpClient,
      '/proxy-v1',
      customFetch as unknown as typeof fetch,
      () => 'proxy-token',
    );

    await fm.getByProject('uzdsn');

    const [calledUrl] = customFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('/proxy-v1/project/uzdsn/metadata/project');
  });

  it('should include Authorization header in custom fetch call', async () => {
    const customFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fileMetadataResponse),
    });
    const fm = new FileMetadata(
      httpClient,
      '/proxy-v1',
      customFetch as unknown as typeof fetch,
      () => 'my-token',
    );

    await fm.getByProject('uzdsn');

    const [, init] = customFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
  });

  it('should support async tokenProvider with custom fetch', async () => {
    const customFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fileMetadataResponse),
    });
    const fm = new FileMetadata(
      httpClient,
      '/proxy-v1',
      customFetch as unknown as typeof fetch,
      () => Promise.resolve('async-token'),
    );

    await fm.getByProject('uzdsn');

    const [, init] = customFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer async-token');
  });

  it('should fall back to httpClient when no custom fetch is provided', async () => {
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(JSON.stringify(fileMetadataResponse));

    const fm = new FileMetadata(httpClient, 'https://rdm.nii.ac.jp/api/v1');
    const result = await fm.getByProject('uzdsn');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.data.id).toBe('uzdsn');
  });
});
