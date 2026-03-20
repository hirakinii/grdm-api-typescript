import { GrdmFiles } from '../../src/resources/GrdmFiles';
import { HttpClient, PaginatedResult } from 'osf-api-v2-typescript';
import fetchMock from 'jest-fetch-mock';

const BASE_URL = 'https://api.rdm.nii.ac.jp/v2/';

/** Minimal JSON:API list response for a single file entry */
function makeFileListResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: [
      {
        id: 'file001',
        type: 'files',
        attributes: {
          name: 'report.pdf',
          kind: 'file',
          path: '/abc123/file001',
          materialized_path: '/subfolder/report.pdf',
          provider: 'osfstorage',
          size: 1024,
          date_created: '2024-01-01T00:00:00.000Z',
          date_modified: '2024-01-02T00:00:00.000Z',
          current_user_can_comment: false,
          delete_allowed: true,
        },
        links: {
          self: `${BASE_URL}files/file001/`,
          info: `${BASE_URL}files/file001/`,
          download: 'https://files.rdm.nii.ac.jp/v1/resources/node123/providers/osfstorage/file001',
        },
      },
    ],
    links: {
      self: `${BASE_URL}nodes/node123/files/osfstorage/abc123/`,
      first: null,
      last: null,
      prev: null,
      next: null,
    },
    meta: { total: 1, per_page: 10 },
    ...overrides,
  };
}

describe('GrdmFiles Resource', () => {
  let grdmFiles: GrdmFiles;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient({ baseUrl: BASE_URL, token: 'dummy-token' });
    grdmFiles = new GrdmFiles(httpClient);
    fetchMock.resetMocks();
  });

  describe('listByPath', () => {
    it('should call nodes/{nodeId}/files/{provider}/{folderPath} URL', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      await grdmFiles.listByPath('node123', 'osfstorage', 'abc123/');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('nodes/node123/files/osfstorage/abc123/'),
        expect.anything(),
      );
    });

    it('should strip a leading slash from folderPath', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      await grdmFiles.listByPath('node123', 'osfstorage', '/abc123/');

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('nodes/node123/files/osfstorage/abc123/');
      expect(calledUrl).not.toMatch(/files\/osfstorage\/\/abc123/);
    });

    it('should preserve a trailing slash in folderPath', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      await grdmFiles.listByPath('node123', 'osfstorage', 'abc123/');

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toMatch(/abc123\//);
    });

    it('should return a TransformedList with file data', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      const result = await grdmFiles.listByPath('node123', 'osfstorage', 'abc123/');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('report.pdf');
      expect(result.data[0].kind).toBe('file');
    });

    it('should forward optional params as query parameters', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      await grdmFiles.listByPath('node123', 'osfstorage', 'abc123/', {
        'filter[kind]': 'file',
        page: 2,
      });

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('filter%5Bkind%5D=file');
      expect(calledUrl).toContain('page=2');
    });

    it('should return an empty data array when the folder is empty', async () => {
      const emptyResponse = {
        data: [],
        links: { self: '', first: null, last: null, prev: null, next: null },
        meta: { total: 0, per_page: 10 },
      };
      fetchMock.mockResponseOnce(JSON.stringify(emptyResponse));

      const result = await grdmFiles.listByPath('node123', 'osfstorage', 'empty/');

      expect(result.data).toHaveLength(0);
    });
  });

  describe('listByPathPaginated', () => {
    it('should return a PaginatedResult instance', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      const result = await grdmFiles.listByPathPaginated('node123', 'osfstorage', 'abc123/');

      expect(result).toBeInstanceOf(PaginatedResult);
    });

    it('should expose first-page data directly', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      const result = await grdmFiles.listByPathPaginated('node123', 'osfstorage', 'abc123/');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('report.pdf');
    });

    it('should call the correct URL for the initial page', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      await grdmFiles.listByPathPaginated('node123', 'osfstorage', '/abc123/');

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('nodes/node123/files/osfstorage/abc123/');
    });

    it('should indicate no next page when there is only one page', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      const result = await grdmFiles.listByPathPaginated('node123', 'osfstorage', 'abc123/');

      expect(result.hasNext).toBe(false);
    });

    it('should iterate all items via items() async generator', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(makeFileListResponse()));

      const result = await grdmFiles.listByPathPaginated('node123', 'osfstorage', 'abc123/');
      const items: unknown[] = [];
      for await (const item of result.items()) {
        items.push(item);
      }

      expect(items).toHaveLength(1);
    });
  });
});
