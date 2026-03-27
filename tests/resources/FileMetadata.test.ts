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
      expect(metadata?.data['grdm-file:data-number']).toEqual({ value: 'D001', extra: [], comments: [] });
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
