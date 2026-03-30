import {
  Ms2MibyoDbMetadataFields,
  Ms2MibyoDbFileMetadataSchema,
  isMs2MibyoDbSchema,
  isPublicFundingSchema,
  SCHEMA_ID_MS2_MIBYODB,
  SCHEMA_ID_PUBLIC_FUNDING,
  GrdmFileMetadataSchema,
} from '../../src/types/file-metadata';
import ms2MibyoDbResponse from '../fixtures/ms2-mibyodb-metadata-response.json';

describe('Ms2MibyoDbMetadataFields types', () => {
  it('should allow an object with string values for schema ② fields', () => {
    const fields: Ms2MibyoDbMetadataFields = {
      'grdm-file:d-msr-object-of-measurement-jp': { value: '血圧', extra: [], comments: [] },
      'grdm-file:d-msr-object-of-measurement-en': { value: 'blood pressure', extra: [], comments: [] },
    };
    expect(fields['grdm-file:d-msr-object-of-measurement-jp']?.value).toBe('血圧');
    expect(fields['grdm-file:d-msr-object-of-measurement-en']?.value).toBe('blood pressure');
  });

  it('should allow null values for schema ② fields', () => {
    const fields: Ms2MibyoDbMetadataFields = {
      'grdm-file:Label-explanation': { value: null, extra: [], comments: [] },
      'grdm-file:d-msr-measuring-device-name': { value: null, extra: [], comments: [] },
      'grdm-file:t-abt-user-defined-metadata-items': { value: null, extra: [], comments: [] },
    };
    expect(fields['grdm-file:Label-explanation']?.value).toBeNull();
    expect(fields['grdm-file:d-msr-measuring-device-name']?.value).toBeNull();
    expect(fields['grdm-file:t-abt-user-defined-metadata-items']?.value).toBeNull();
  });

  it('should allow the t-abt-text/binary field with slash in key', () => {
    const fields: Ms2MibyoDbMetadataFields = {
      'grdm-file:t-abt-text/binary': { value: 'text', extra: [], comments: [] },
    };
    expect(fields['grdm-file:t-abt-text/binary']?.value).toBe('text');
  });
});

describe('Schema ID constants', () => {
  it('should export SCHEMA_ID_PUBLIC_FUNDING', () => {
    expect(SCHEMA_ID_PUBLIC_FUNDING).toBe('66d7d4ec299c4f00071be84f');
  });

  it('should export SCHEMA_ID_MS2_MIBYODB', () => {
    expect(SCHEMA_ID_MS2_MIBYODB).toBe('67e381081921b4000842c800');
  });
});

describe('isMs2MibyoDbSchema type guard', () => {
  it('should return true for a schema with the MS2 Mibyodb schema ID', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: SCHEMA_ID_MS2_MIBYODB,
      active: true,
      data: {
        'grdm-file:d-msr-object-of-measurement-jp': { value: '血圧', extra: [], comments: [] },
      },
    };
    expect(isMs2MibyoDbSchema(schema)).toBe(true);
  });

  it('should return false for a schema with the public funding schema ID', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: SCHEMA_ID_PUBLIC_FUNDING,
      active: true,
      data: {
        'grdm-file:title-ja': { value: 'タイトル', extra: [], comments: [] },
      },
    };
    expect(isMs2MibyoDbSchema(schema)).toBe(false);
  });

  it('should return false for an unknown schema ID', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: 'unknown-schema-id',
      active: true,
      data: {},
    };
    expect(isMs2MibyoDbSchema(schema)).toBe(false);
  });

  it('should narrow type to Ms2MibyoDbFileMetadataSchema after guard', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: SCHEMA_ID_MS2_MIBYODB,
      active: true,
      data: {
        'grdm-file:d-msr-object-of-measurement-jp': { value: '血圧', extra: [], comments: [] },
        'grdm-file:d-msr-data-type-en': { value: 'numeric', extra: [], comments: [] },
      },
    };
    if (isMs2MibyoDbSchema(schema)) {
      const narrowed: Ms2MibyoDbFileMetadataSchema = schema;
      expect(narrowed.data['grdm-file:d-msr-object-of-measurement-jp']?.value).toBe('血圧');
      expect(narrowed.data['grdm-file:d-msr-data-type-en']?.value).toBe('numeric');
    } else {
      throw new Error('Expected isMs2MibyoDbSchema to return true');
    }
  });
});

describe('isPublicFundingSchema type guard', () => {
  it('should return true for a schema with the public funding schema ID', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: SCHEMA_ID_PUBLIC_FUNDING,
      active: true,
      data: {
        'grdm-file:title-ja': { value: 'タイトル', extra: [], comments: [] },
      },
    };
    expect(isPublicFundingSchema(schema)).toBe(true);
  });

  it('should return false for a schema with the MS2 Mibyodb schema ID', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: SCHEMA_ID_MS2_MIBYODB,
      active: true,
      data: {
        'grdm-file:d-msr-object-of-measurement-jp': { value: '血圧', extra: [], comments: [] },
      },
    };
    expect(isPublicFundingSchema(schema)).toBe(false);
  });

  it('should return false for an unknown schema ID', () => {
    const schema: GrdmFileMetadataSchema = {
      schema: 'unknown-schema-id',
      active: true,
      data: {},
    };
    expect(isPublicFundingSchema(schema)).toBe(false);
  });
});

describe('GrdmFileMetadataResponse with schema ② fixture', () => {
  it('should parse the MS2 Mibyodb fixture response correctly', () => {
    const items = ms2MibyoDbResponse.data.attributes.files[0].items;
    expect(items).toHaveLength(1);
    expect(items[0].schema).toBe(SCHEMA_ID_MS2_MIBYODB);
    expect(items[0].active).toBe(true);
  });

  it('should access measurement fields from fixture after type guard', () => {
    const schema = ms2MibyoDbResponse.data.attributes.files[0].items[0] as GrdmFileMetadataSchema;
    if (isMs2MibyoDbSchema(schema)) {
      expect(schema.data['grdm-file:d-msr-object-of-measurement-jp']?.value).toBe('血圧');
      expect(schema.data['grdm-file:d-msr-object-of-measurement-en']?.value).toBe('blood pressure');
      expect(schema.data['grdm-file:Label-explanation']?.value).toBeNull();
    } else {
      throw new Error('Expected isMs2MibyoDbSchema to return true for fixture');
    }
  });
});
