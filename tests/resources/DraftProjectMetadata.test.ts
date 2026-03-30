import { DraftProjectMetadata } from '../../src/resources/DraftProjectMetadata';
import { HttpClient } from 'osf-api-v2-typescript';
import { GrdmCreator, GrdmRegisteredMeta } from '../../src/types/project-metadata';
import { Ms2ProjectRegisteredMeta } from '../../src/types/ms2-mibyodb-metadata';
import draftRegistrationResponse from '../fixtures/draft-registration-response.json';
import draftRegistrationMs2Response from '../fixtures/draft-registration-ms2-response.json';
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
      expect(draft.grdmMeta?.schemaType).toBe('public-funding');
      const meta = draft.grdmMeta as GrdmRegisteredMeta;
      expect(meta.funder).toBe('JSPS');
      expect(meta.programNameJa).toBe('若手研究');
      expect(meta.programNameEn).toBe('Youth Research');
      expect(meta.japanGrantNumber).toBe('JP25K12345');
      expect(meta.fundingStreamCode).toBe('JP');
      expect(meta.projectResearchField).toBe('1000');
    });

    it('should parse grdm-files within draft registration metadata', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationResponse));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta1 = result.data[0].grdmMeta as GrdmRegisteredMeta;
      expect(meta1.grdmFiles).toHaveLength(1);
      const file = meta1.grdmFiles?.[0];
      expect(file?.path).toBe('osfstorage/README.md');
      expect(file?.urlpath).toBe('/wvrae/');
      expect(file?.metadata['grdm-file:title-ja']?.value).toBe('プロジェクト用README');
    });

    it('should parse creators within grdm-files', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationResponse));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta2 = result.data[0].grdmMeta as GrdmRegisteredMeta;
      const file = meta2.grdmFiles?.[0];
      const creators = file?.metadata['grdm-file:creators']?.value as GrdmCreator[];
      expect(creators).toHaveLength(1);
      expect(creators[0].number).toBe('10880916');
      expect(creators[0].name_en).toBe('Toshiyuki Hiraki');
    });

    it('should not set registrationSupplement (not present in draft registrations)', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationResponse));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta3 = result.data[0].grdmMeta as GrdmRegisteredMeta;
      expect(meta3.registrationSupplement).toBeUndefined();
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
      expect(result.data[0].grdmMeta?.schemaType).toBe('public-funding');
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
      expect(result.data[0].grdmMeta?.schemaType).toBe('public-funding');
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
      const meta = result.grdmMeta as GrdmRegisteredMeta;
      expect(meta?.funder).toBe('JSPS');
      expect(meta?.japanGrantNumber).toBe('JP25K12345');
    });

    it('should parse grdm-files for single draft registration', async () => {
      const singleResponse = {
        data: draftRegistrationResponse.data[0],
      };
      fetchMock.mockResponseOnce(JSON.stringify(singleResponse));

      const result = await draftProjectMetadata.getById('69c2a92718fee90010966925');

      const meta = result.grdmMeta as GrdmRegisteredMeta;
      expect(meta?.grdmFiles).toHaveLength(1);
      expect(meta?.grdmFiles?.[0].path).toBe('osfstorage/README.md');
    });
  });

  describe('schema ② (MS2 Mibyodb) support', () => {
    it('should dispatch to MS2 parser when registration_schema is ms2-mibyodb', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationMs2Response));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      expect(result.data).toHaveLength(1);
      const draft = result.data[0];
      expect(draft.id).toBe('69ca249618fee90010970661');
      expect(draft.grdmMeta?.schemaType).toBe('ms2-mibyodb');
    });

    it('should parse MS2 project-level fields', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationMs2Response));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta = result.data[0].grdmMeta as Ms2ProjectRegisteredMeta;
      expect(meta.projectName).toBe('MS2合原PJ|MS2 Aihara PJ');
      expect(meta.titleOfDataset).toBe(
        'Investigation of size dependence of Bragg intensity from single particle',
      );
      expect(meta.datasetResearchField).toBe('自然科学一般|Natural Science');
      expect(meta.accessRights).toBe('共有|restricted access');
      expect(meta.repositoryInformation).toBe('GakuNin RDM');
      expect(meta.dateRegisteredInMetadata).toBe('2026-03-30');
    });

    it('should parse MS2 data-creator persons', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationMs2Response));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta = result.data[0].grdmMeta as Ms2ProjectRegisteredMeta;
      expect(meta.dataCreators).toHaveLength(1);
      expect(meta.dataCreators?.[0].name).toBe('平木俊幸');
      expect(meta.dataCreators?.[0].nameEn).toBe('Toshiyuki Hiraki');
      expect(meta.dataCreators?.[0].contact).toBe('hiraki@nii.ac.jp');
    });

    it('should parse MS2 keywords', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationMs2Response));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta = result.data[0].grdmMeta as Ms2ProjectRegisteredMeta;
      expect(meta.keywords).toHaveLength(1);
      expect(meta.keywords?.[0].filename).toBe('XFEL');
      expect(meta.keywords?.[0].filenameEn).toBe('XFEL');
    });

    it('should parse MS2 Analysis-type array', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationMs2Response));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta = result.data[0].grdmMeta as Ms2ProjectRegisteredMeta;
      expect(meta.analysisType).toEqual(['イメージデータ|Imaging data']);
    });

    it('should parse MS2 checklists', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationMs2Response));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta = result.data[0].grdmMeta as Ms2ProjectRegisteredMeta;
      expect(meta.checklists?.['Checklist1']).toBeDefined();
      expect(meta.checklists?.['Checklist2']).toBeDefined();
    });

    it('should parse MS2 grdm-files', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(draftRegistrationMs2Response));

      const result = await draftProjectMetadata.listByNode('uzdsn');

      const meta = result.data[0].grdmMeta as Ms2ProjectRegisteredMeta;
      expect(meta.grdmFiles).toHaveLength(1);
      expect(meta.grdmFiles?.[0].path).toBe('osfstorage/data.hdf5');
    });

    it('should use getById and parse MS2 metadata', async () => {
      const singleResponse = { data: draftRegistrationMs2Response.data[0] };
      fetchMock.mockResponseOnce(JSON.stringify(singleResponse));

      const result = await draftProjectMetadata.getById('69ca249618fee90010970661');

      expect(result.grdmMeta?.schemaType).toBe('ms2-mibyodb');
      const meta = result.grdmMeta as Ms2ProjectRegisteredMeta;
      expect(meta.projectName).toBe('MS2合原PJ|MS2 Aihara PJ');
    });
  });
});
