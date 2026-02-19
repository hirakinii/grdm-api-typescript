import { ProjectMetadata } from '../../src/resources/ProjectMetadata';
import { HttpClient } from 'osf-api-v2-typescript';
import projectMetadataResponse from '../fixtures/project-metadata-response.json';
import fetchMock from 'jest-fetch-mock';

describe('ProjectMetadata Resource', () => {
  let projectMetadata: ProjectMetadata;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: 'https://api.rdm.nii.ac.jp/v2/',
      token: 'dummy-token'
    });
    projectMetadata = new ProjectMetadata(httpClient);
    fetchMock.resetMocks();
  });

  describe('listByNode', () => {
    it('should fetch registrations by node ID and parse GRDM metadata', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(projectMetadataResponse));

      const result = await projectMetadata.listByNode('abcde');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('nodes/abcde/registrations/'),
        expect.anything()
      );

      expect(result.data).toHaveLength(1);
      const reg = result.data[0];
      expect(reg.id).toBe('uzdsn');
      expect(reg.grdmMeta).toBeDefined();
      expect(reg.grdmMeta?.funder).toBe('JSPS');
      expect(reg.grdmMeta?.grdmFiles).toHaveLength(1);
      expect(reg.grdmMeta?.grdmFiles?.[0].path).toBe('osfstorage/README.md');
    });

    it('should handle empty metadata', async () => {
      const emptyResponse = {
        data: [
          {
            id: 'empty',
            type: 'registrations',
            attributes: {
              title: 'Empty',
              registered_meta: {}
            }
          }
        ]
      };
      fetchMock.mockResponseOnce(JSON.stringify(emptyResponse));

      const result = await projectMetadata.listByNode('abcde');
      expect(result.data[0].grdmMeta).toEqual({});
    });

    it('should handle missing registered_meta', async () => {
      const missingResponse = {
        data: [
          {
            id: 'missing',
            type: 'registrations',
            attributes: {
              title: 'Missing'
            }
          }
        ]
      };
      fetchMock.mockResponseOnce(JSON.stringify(missingResponse));

      const result = await projectMetadata.listByNode('abcde');
      expect(result.data[0].grdmMeta).toEqual({});
    });
  });

  describe('getById', () => {
    it('should fetch a single registration and parse GRDM metadata', async () => {
      const singleResponse = {
        data: projectMetadataResponse.data[0]
      };
      fetchMock.mockResponseOnce(JSON.stringify(singleResponse));

      const result = await projectMetadata.getById('uzdsn');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('registrations/uzdsn/'),
        expect.anything()
      );

      expect(result.id).toBe('uzdsn');
      expect(result.grdmMeta?.funder).toBe('JSPS');
    });
  });
});
