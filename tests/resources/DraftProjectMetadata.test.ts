import { DraftProjectMetadata } from '../../src/resources/DraftProjectMetadata';
import { HttpClient } from 'osf-api-v2-typescript';
import { GrdmCreator } from '../../src/types/project-metadata';
import draftRegistrationResponse from '../fixtures/draft-registration-response.json';
import fetchMock from 'jest-fetch-mock';

describe('DraftProjectMetadata Resource', () => {
  let draftProjectMetadata: DraftProjectMetadata;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: 'https://api.rdm.nii.ac.jp/v2/',
      token: 'dummy-token',
    });
    draftProjectMetadata = new DraftProjectMetadata(httpClient);
    fetchMock.resetMocks();
  });

  describe('listByNode', () => {
    it('should fetch draft registrations by node ID and parse GRDM metadata', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationResponse));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('nodes/uzdsn/draft_registrations/'),
        expect.anything(),
      );

      expect(result.data).toHaveLength(1);
      const draft = result.data[0];
      expect(draft.id).toBe('69c2a92718fee90010966925');
      expect(draft.grdmMeta).toBeDefined();
      expect(draft.grdmMeta?.funder).toBe('JSPS');
      expect(draft.grdmMeta?.programNameJa).toBe('若手研究');
      expect(draft.grdmMeta?.programNameEn).toBe('Youth Research');
      expect(draft.grdmMeta?.japanGrantNumber).toBe('JP25K12345');
      expect(draft.grdmMeta?.fundingStreamCode).toBe('JP');
      expect(draft.grdmMeta?.projectResearchField).toBe('1000');
    });

    it('should parse grdm-files within draft registration metadata', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationResponse));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      expect(result.data[0].grdmMeta?.grdmFiles).toHaveLength(1);
      const file = result.data[0].grdmMeta?.grdmFiles?.[0];
      expect(file?.path).toBe('osfstorage/README.md');
      expect(file?.urlpath).toBe('/wvrae/');
      expect(file?.metadata['grdm-file:title-ja']?.value).toBe('プロジェクト用README');
    });

    it('should parse creators within grdm-files', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationResponse));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const file = result.data[0].grdmMeta?.grdmFiles?.[0];
      const creators = file?.metadata['grdm-file:creators']?.value as GrdmCreator[];
      expect(creators).toHaveLength(1);
      expect(creators[0].number).toBe('10880916');
      expect(creators[0].name_en).toBe('Toshiyuki Hiraki');
    });

    it('should not set registrationSupplement (not present in draft registrations)', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationResponse));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      expect(result.data[0].grdmMeta?.registrationSupplement).toBeUndefined();
    });

    it('should handle empty registration_metadata', async () => {
      const emptyResponse = {
        data: [
          {
            id: 'empty',
            type: 'draft_registrations',
            attributes: {
              title: 'Empty',
              description: '',
              category: 'project',
              tags: [],
              has_project: true,
              datetime_initiated: '2026-01-01T00:00:00',
              datetime_updated: '2026-01-01T00:00:00',
              registration_metadata: {},
            },
          },
        ],
      };
      fetchMock.mockResponseOnce(JSON.stringify(emptyResponse));

      const result = await draftProjectMetadata.listByNode('abcde');
      expect(result.data[0].grdmMeta).toEqual({});
    });

    it('should handle missing registration_metadata', async () => {
      const missingResponse = {
        data: [
          {
            id: 'missing',
            type: 'draft_registrations',
            attributes: {
              title: 'Missing',
              description: '',
              category: 'project',
              tags: [],
              has_project: true,
              datetime_initiated: '2026-01-01T00:00:00',
              datetime_updated: '2026-01-01T00:00:00',
            },
          },
        ],
      };
      fetchMock.mockResponseOnce(JSON.stringify(missingResponse));

      const result = await draftProjectMetadata.listByNode('abcde');
      expect(result.data[0].grdmMeta).toEqual({});
    });

    it('should handle malformed grdm-files JSON gracefully', async () => {
      const malformedResponse = {
        data: [
          {
            id: 'malformed',
            type: 'draft_registrations',
            attributes: {
              title: 'Malformed',
              description: '',
              category: 'project',
              tags: [],
              has_project: true,
              datetime_initiated: '2026-01-01T00:00:00',
              datetime_updated: '2026-01-01T00:00:00',
              registration_metadata: {
                'grdm-files': {
                  value: 'not valid json{{{',
                  extra: [],
                },
              },
            },
          },
        ],
      };
      fetchMock.mockResponseOnce(JSON.stringify(malformedResponse));

      const result = await draftProjectMetadata.listByNode('abcde');
      expect(result.data[0].grdmMeta?.grdmFiles).toBeUndefined();
    });
  });

  describe('getById', () => {
    it('should fetch a single draft registration and parse GRDM metadata', async () => {
      const singleResponse = {
        data: draftRegistrationResponse.data[0],
      };
      fetchMock.mockResponseOnce(JSON.stringify(singleResponse));

      const result = await draftProjectMetadata.getById('69c2a92718fee90010966925');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('draft_registrations/69c2a92718fee90010966925/'),
        expect.anything(),
      );

      expect(result.id).toBe('69c2a92718fee90010966925');
      expect(result.grdmMeta?.funder).toBe('JSPS');
      expect(result.grdmMeta?.japanGrantNumber).toBe('JP25K12345');
    });

    it('should parse grdm-files for single draft registration', async () => {
      const singleResponse = {
        data: draftRegistrationResponse.data[0],
      };
      fetchMock.mockResponseOnce(JSON.stringify(singleResponse));

      const result = await draftProjectMetadata.getById('69c2a92718fee90010966925');

      expect(result.grdmMeta?.grdmFiles).toHaveLength(1);
      expect(result.grdmMeta?.grdmFiles?.[0].path).toBe('osfstorage/README.md');
    });
  });
});
