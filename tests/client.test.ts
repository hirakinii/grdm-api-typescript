import fetchMock from 'jest-fetch-mock';
import { GrdmClientConfig } from '../src/types/config';
import { GrdmClient } from '../src/client';
import { ProjectMetadata } from '../src/resources/ProjectMetadata';
import { FileMetadata } from '../src/resources/FileMetadata';

describe('GrdmClientConfig', () => {
  it('should allow optional baseUrl and v1BaseUrl', () => {
    const config: GrdmClientConfig = {
      token: 'test-token',
      baseUrl: 'https://api.example.com/v2/',
      v1BaseUrl: 'https://api.example.com/v1',
    };
    expect(config.baseUrl).toBe('https://api.example.com/v2/');
    expect(config.v1BaseUrl).toBe('https://api.example.com/v1');
  });

  it('should allow omitting optional properties', () => {
    const config: GrdmClientConfig = {
      token: 'test-token',
    };
    expect(config.baseUrl).toBeUndefined();
    expect(config.v1BaseUrl).toBeUndefined();
  });
});

describe('GrdmClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('constructor defaults', () => {
    it('should use the default GRDM baseUrl when none is provided', () => {
      const client = new GrdmClient({ token: 'test-token' });
      // The v1BaseUrl should be inferred from the default GRDM base URL
      expect(client.v1BaseUrl).toBe('https://rdm.nii.ac.jp/api/v1');
    });

    it('should use custom baseUrl when provided', () => {
      const client = new GrdmClient({
        token: 'test-token',
        baseUrl: 'https://api.test.rdm.nii.ac.jp/v2/',
      });
      expect(client.v1BaseUrl).toBe('https://test.rdm.nii.ac.jp/api/v1');
    });

    it('should use explicit v1BaseUrl when provided', () => {
      const client = new GrdmClient({
        token: 'test-token',
        baseUrl: 'https://api.rdm.nii.ac.jp/v2/',
        v1BaseUrl: 'https://custom.example.com/api/v1',
      });
      expect(client.v1BaseUrl).toBe('https://custom.example.com/api/v1');
    });
  });

  describe('resource accessors', () => {
    let client: GrdmClient;

    beforeEach(() => {
      client = new GrdmClient({ token: 'test-token' });
    });

    it('should expose projectMetadata as a ProjectMetadata instance', () => {
      expect(client.projectMetadata).toBeInstanceOf(ProjectMetadata);
    });

    it('should return the same projectMetadata instance on repeated access (lazy init)', () => {
      const first = client.projectMetadata;
      const second = client.projectMetadata;
      expect(first).toBe(second);
    });

    it('should expose fileMetadata as a FileMetadata instance', () => {
      expect(client.fileMetadata).toBeInstanceOf(FileMetadata);
    });

    it('should return the same fileMetadata instance on repeated access (lazy init)', () => {
      const first = client.fileMetadata;
      const second = client.fileMetadata;
      expect(first).toBe(second);
    });

    it('should expose inherited OsfClient nodes resource', () => {
      expect(client.nodes).toBeDefined();
    });

    it('should expose inherited OsfClient files resource', () => {
      expect(client.files).toBeDefined();
    });

    it('should expose inherited OsfClient users resource', () => {
      expect(client.users).toBeDefined();
    });

    it('should expose inherited OsfClient registrations resource', () => {
      expect(client.registrations).toBeDefined();
    });
  });

  describe('authentication', () => {
    it('should work with token authentication', () => {
      const client = new GrdmClient({ token: 'my-token' });
      expect(client).toBeInstanceOf(GrdmClient);
    });

    it('should work with tokenProvider authentication', () => {
      const tokenProvider = () => Promise.resolve('dynamic-token');
      const client = new GrdmClient({ tokenProvider });
      expect(client).toBeInstanceOf(GrdmClient);
    });

    it('should throw when no authentication is provided', () => {
      // OsfClient requires at least one of: token, oauth2Client, or tokenProvider
      expect(() => new GrdmClient()).toThrow(
        'One of token, oauth2Client, or tokenProvider must be provided',
      );
    });
  });

  describe('projectMetadata integration', () => {
    it('should use the correct v2 API endpoint for listByNode', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          data: [],
          links: { self: '', first: null, last: null, prev: null, next: null },
          meta: { total: 0, per_page: 10 },
        }),
      );

      const client = new GrdmClient({ token: 'test-token' });
      await client.projectMetadata.listByNode('node123');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('nodes/node123/registrations/');
    });
  });

  describe('fileMetadata integration', () => {
    it('should use the correct v1 API endpoint for getByProject', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          data: {
            id: 'project123',
            type: 'file-metadata',
            attributes: {
              editable: true,
              features: {},
              files: [],
            },
          },
        }),
      );

      const client = new GrdmClient({ token: 'test-token' });
      await client.fileMetadata.getByProject('project123');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain('rdm.nii.ac.jp/api/v1/project/project123/metadata/project');
    });
  });
});
