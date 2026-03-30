import { parseGrdmMetaRecord, parseMs2ProjectMetaRecord } from '../../src/utils/parseGrdmMeta';

describe('parseGrdmMetaRecord (schema ①: public-funding)', () => {
  it('should return schemaType public-funding', () => {
    const result = parseGrdmMetaRecord({ funder: { value: 'JSPS', extra: [], comments: [] } });
    expect(result.schemaType).toBe('public-funding');
  });

  it('should parse all standard fields', () => {
    const record = {
      funder: { value: 'JSPS', extra: [], comments: [] },
      'program-name-ja': { value: '若手研究', extra: [], comments: [] },
      'program-name-en': { value: 'Youth Research', extra: [], comments: [] },
      'project-name-ja': { value: 'プロジェクト', extra: [], comments: [] },
      'project-name-en': { value: 'Project', extra: [], comments: [] },
      'japan-grant-number': { value: 'JP25K12345', extra: [], comments: [] },
      'funding-stream-code': { value: 'JP', extra: [], comments: [] },
      'project-research-field': { value: '1000', extra: [], comments: [] },
    };
    const result = parseGrdmMetaRecord(record);
    expect(result.funder).toBe('JSPS');
    expect(result.programNameJa).toBe('若手研究');
    expect(result.programNameEn).toBe('Youth Research');
    expect(result.projectNameJa).toBe('プロジェクト');
    expect(result.projectNameEn).toBe('Project');
    expect(result.japanGrantNumber).toBe('JP25K12345');
    expect(result.fundingStreamCode).toBe('JP');
    expect(result.projectResearchField).toBe('1000');
  });

  it('should return empty object for empty record', () => {
    const result = parseGrdmMetaRecord({});
    expect(result.schemaType).toBe('public-funding');
    expect(result.funder).toBeUndefined();
  });
});

describe('parseMs2ProjectMetaRecord (schema ②: ms2-mibyodb)', () => {
  const buildField = (value: unknown) => ({ value, extra: [], comments: [] });

  const fullRecord: Record<string, unknown> = {
    'project-name': buildField('MS2合原PJ|MS2 Aihara PJ'),
    'title-of-dataset': buildField('Investigation of size dependence of Bragg intensity from single particle'),
    'title-of-dataset-en': buildField('Investigation of size dependence of Bragg intensity from single particle'),
    'data-creator': buildField(
      '[{"name":"平木俊幸","name-en":"Toshiyuki Hiraki","belonging":"国立情報学研究所","belonging-en":"National Institute of Informatics","contact":"hiraki@nii.ac.jp"}]',
    ),
    'data-manager': buildField(
      '[{"name":"平木俊幸","name-en":"Toshiyuki Hiraki","belonging":"国立情報学研究所","belonging-en":"National Institute of Informatics","contact":"hiraki@nii.ac.jp"}]',
    ),
    keywords: buildField('[{"filename":"XFEL","filename-en":"XFEL"}]'),
    'dataset-research-field': buildField('自然科学一般|Natural Science'),
    'access-rights': buildField('共有|restricted access'),
    'data-policy-free': buildField('無償|Free'),
    'data-policy-license': buildField('CC BY-NC 4.0 表示—非営利|CC BY-NC 4.0 Attribution—NonCommercial'),
    'informed-consent': buildField('不要|Unnecessary'),
    'anonymous-processing': buildField(''),
    'ethics-review-committee-approval': buildField('不要'),
    'purpose-of-experiment': buildField('ナノ粒子の励起状態による構造変化を Bragg 散乱スポットの変化で追跡する。'),
    'purpose-of-experiment-en': buildField(''),
    'description-of-experimental-condition': buildField('SACLA にてナノ粒子にX線を照射する。'),
    'description-of-experimental-condition-en': buildField(''),
    'Analysis-type': buildField(['イメージデータ|Imaging data']),
    'Analysis-type-other': buildField(''),
    'target-type-of-acquired-data': buildField('無機物'),
    'target-type-of-acquired-data-en': buildField('Non-organic materials'),
    'availability-of-commercial-use': buildField('否|No'),
    'conflict-of-interest-Yes-or-No': buildField('無|No'),
    'necessity-of-contact-and-permission': buildField('許諾が必要|Permission required'),
    'necessity-of-including-in-acknowledgments': buildField('要|Necessary'),
    'names-to-be-included-in-the-acknowledgments': buildField('平木俊幸, 国立情報学研究所'),
    'names-to-be-included-in-the-acknowledgments-en': buildField('Toshiyuki Hiraki, National Institute of Informatics'),
    'repository-information': buildField('GakuNin RDM'),
    'repository-url-doi-link': buildField(''),
    'date-registered-in-metadata': buildField('2026-03-30'),
    'date-updated-in-metadata': buildField('2026-03-30'),
    'disclaimer-version': buildField('2025/03/19'),
    'disclaimer-check-date': buildField('2026/03/30'),
    'grdm-files': buildField(
      '[{"path":"osfstorage/data.hdf5","urlpath":"/uzdsn/files/osfstorage/abc123","metadata":{"grdm-file:d-msr-data-type-jp":{"extra":[],"comments":[],"value":""}}}]',
    ),
    Checklist1: buildField(['協定書を読みましたか？|Have you read the agreement?']),
    Checklist2: buildField(['適切な処理を行いましたか？|Have you processed appropriately?']),
  };

  it('should return schemaType ms2-mibyodb', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.schemaType).toBe('ms2-mibyodb');
  });

  it('should parse project-name', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.projectName).toBe('MS2合原PJ|MS2 Aihara PJ');
  });

  it('should parse title fields', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.titleOfDataset).toBe(
      'Investigation of size dependence of Bragg intensity from single particle',
    );
    expect(result.titleOfDatasetEn).toBe(
      'Investigation of size dependence of Bragg intensity from single particle',
    );
  });

  it('should parse data-creator as Ms2Person array', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.dataCreators).toHaveLength(1);
    expect(result.dataCreators?.[0].name).toBe('平木俊幸');
    expect(result.dataCreators?.[0].nameEn).toBe('Toshiyuki Hiraki');
    expect(result.dataCreators?.[0].belonging).toBe('国立情報学研究所');
    expect(result.dataCreators?.[0].belongingEn).toBe('National Institute of Informatics');
    expect(result.dataCreators?.[0].contact).toBe('hiraki@nii.ac.jp');
  });

  it('should parse data-manager as Ms2Person array', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.dataManagers).toHaveLength(1);
    expect(result.dataManagers?.[0].name).toBe('平木俊幸');
    expect(result.dataManagers?.[0].nameEn).toBe('Toshiyuki Hiraki');
  });

  it('should parse keywords as Ms2Keyword array', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.keywords).toHaveLength(1);
    expect(result.keywords?.[0].filename).toBe('XFEL');
    expect(result.keywords?.[0].filenameEn).toBe('XFEL');
  });

  it('should parse string metadata fields', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.datasetResearchField).toBe('自然科学一般|Natural Science');
    expect(result.accessRights).toBe('共有|restricted access');
    expect(result.dataPolicyFree).toBe('無償|Free');
    expect(result.dataPolicyLicense).toBe(
      'CC BY-NC 4.0 表示—非営利|CC BY-NC 4.0 Attribution—NonCommercial',
    );
    expect(result.informedConsent).toBe('不要|Unnecessary');
    expect(result.ethicsReviewCommitteeApproval).toBe('不要');
    expect(result.purposeOfExperiment).toBe(
      'ナノ粒子の励起状態による構造変化を Bragg 散乱スポットの変化で追跡する。',
    );
    expect(result.descriptionOfExperimentalCondition).toBe('SACLA にてナノ粒子にX線を照射する。');
    expect(result.targetTypeOfAcquiredData).toBe('無機物');
    expect(result.targetTypeOfAcquiredDataEn).toBe('Non-organic materials');
    expect(result.availabilityOfCommercialUse).toBe('否|No');
    expect(result.conflictOfInterest).toBe('無|No');
    expect(result.necessityOfContactAndPermission).toBe('許諾が必要|Permission required');
    expect(result.necessityOfIncludingInAcknowledgments).toBe('要|Necessary');
    expect(result.namesToBeIncludedInAcknowledgments).toBe('平木俊幸, 国立情報学研究所');
    expect(result.namesToBeIncludedInAcknowledgmentsEn).toBe(
      'Toshiyuki Hiraki, National Institute of Informatics',
    );
    expect(result.repositoryInformation).toBe('GakuNin RDM');
    expect(result.dateRegisteredInMetadata).toBe('2026-03-30');
    expect(result.dateUpdatedInMetadata).toBe('2026-03-30');
    expect(result.disclaimerVersion).toBe('2025/03/19');
    expect(result.disclaimerCheckDate).toBe('2026/03/30');
  });

  it('should parse Analysis-type as string array', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.analysisType).toEqual(['イメージデータ|Imaging data']);
  });

  it('should parse grdm-files', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.grdmFiles).toHaveLength(1);
    expect(result.grdmFiles?.[0].path).toBe('osfstorage/data.hdf5');
    expect(result.grdmFiles?.[0].urlpath).toBe('/uzdsn/files/osfstorage/abc123');
  });

  it('should parse Checklist entries into checklists map', () => {
    const result = parseMs2ProjectMetaRecord(fullRecord);
    expect(result.checklists?.['Checklist1']).toEqual([
      '協定書を読みましたか？|Have you read the agreement?',
    ]);
    expect(result.checklists?.['Checklist2']).toEqual([
      '適切な処理を行いましたか？|Have you processed appropriately?',
    ]);
  });

  it('should return empty checklists when no Checklist fields exist', () => {
    const result = parseMs2ProjectMetaRecord({
      'project-name': buildField('Test'),
    });
    expect(result.checklists).toEqual({});
  });

  it('should handle missing optional fields gracefully', () => {
    const result = parseMs2ProjectMetaRecord({});
    expect(result.schemaType).toBe('ms2-mibyodb');
    expect(result.projectName).toBeUndefined();
    expect(result.dataCreators).toBeUndefined();
    expect(result.keywords).toBeUndefined();
    expect(result.grdmFiles).toBeUndefined();
    expect(result.checklists).toEqual({});
  });

  it('should handle malformed data-creator JSON gracefully', () => {
    const result = parseMs2ProjectMetaRecord({
      'data-creator': buildField('not valid json{{{'),
    });
    expect(result.dataCreators).toBeUndefined();
  });

  it('should handle malformed grdm-files JSON gracefully', () => {
    const result = parseMs2ProjectMetaRecord({
      'grdm-files': buildField('not valid json{{{'),
    });
    expect(result.grdmFiles).toBeUndefined();
  });
});
