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
import {
  Ms2FileNameConvention,
  Ms2FolderDescription,
  Ms2MeasuringDevice,
  Ms2MibyoDbMetadataField,
  Ms2Procedure,
  Ms2ProjectRegisteredMeta,
  Ms2TermDescription,
  Ms2UserDefinedMetadataItem,
} from '../../src/types/ms2-mibyodb-metadata';

const device: Ms2MeasuringDevice = { 'Measuring-device-name': '血圧計', 'Measuring-device-name-en': 'Sphygmomanometer' };
const procedure: Ms2Procedure = { Procedure: '手順', 'Procedure-en': '' };
const item: Ms2UserDefinedMetadataItem = {
  'Metadata-item-name': '項目',
  'value-or-content': '値',
  'Metadata-item-name-en': 'Item',
  'value-or-content-en': 'Value',
};
const folder: Ms2FolderDescription = {
  'folder-name': 'raw',
  'description-of-folder': '生データ',
  'description-of-folder-en': 'Raw data',
  contents: '',
};
const convention: Ms2FileNameConvention = { 'storage-folder': 'raw', 'file-name-convention-file-extension': '*.csv' };
const term: Ms2TermDescription = {
  'Position-of-row': '1',
  'Name-of-term': '時刻',
  'Description-of-term': '測定時刻',
  'Position-of-row-en': '1',
  'Name-of-term-en': 'Time',
  'Description-of-term-en': 'Measurement time',
};

describe('Ms2MibyoDbMetadataFields array fields', () => {
  const wrap = <T>(value: T): Ms2MibyoDbMetadataField<T> => ({ value, extra: [], comments: [] });

  it('should accept arrays of the element type for all 13 array fields', () => {
    const fields: Ms2MibyoDbMetadataFields = {
      'grdm-file:d-msr-measuring-device-name': wrap([device]),
      'grdm-file:d-msr-procedure': wrap([procedure]),
      'grdm-file:d-msr-user-defined-metadata-items': wrap([item]),
      'grdm-file:t-abt-user-defined-metadata-items': wrap([item]),
      'grdm-file:d-fol-Structure-or-descriptions-of-folders-jp': wrap([folder]),
      'grdm-file:d-txt-file-name-convention-file-extension': wrap([convention]),
      'grdm-file:d-exl-file-name-convention-file-extension': wrap([convention]),
      'grdm-file:d-img-file-name-convention-file-extension': wrap([convention]),
      'grdm-file:d-abt-file-name-convention-file-extension': wrap([convention]),
      'grdm-file:d-txt-description-of-row': wrap([term]),
      'grdm-file:d-txt-description-of-column': wrap([term]),
      'grdm-file:d-exl-description-of-row': wrap([term]),
      'grdm-file:d-exl-description-of-column': wrap([term]),
    };
    expect(Object.keys(fields)).toHaveLength(13);
  });

  it('should type the value of an array field as Element[] | null', () => {
    const fields: Ms2MibyoDbMetadataFields = { 'grdm-file:d-msr-procedure': wrap([procedure]) };
    const procedures: Ms2Procedure[] | null | undefined = fields['grdm-file:d-msr-procedure']?.value;
    expect(procedures?.[0].Procedure).toBe('手順');
  });

  it('should reject wrong shapes for array fields', () => {
    const fields: Ms2MibyoDbMetadataFields = {
      // @ts-expect-error a plain string is not an array of procedures
      'grdm-file:d-msr-procedure': wrap('手順'),
      // @ts-expect-error an element must have all properties
      'grdm-file:d-msr-measuring-device-name': wrap([{ 'Measuring-device-name': '血圧計' }]),
      // @ts-expect-error element properties are strings
      'grdm-file:d-msr-user-defined-metadata-items': wrap([{ ...item, 'value-or-content': 1 }]),
    };
    expect(fields).toBeDefined();
  });

  it('should keep string | null for text fields and reject arrays there', () => {
    const fields: Ms2MibyoDbMetadataFields = {
      'grdm-file:d-msr-remarks-jp': wrap(''),
      // @ts-expect-error a text field does not accept an array
      'grdm-file:d-msr-remarks-en': wrap([procedure]),
    };
    const remarks: string | null | undefined = fields['grdm-file:d-msr-remarks-jp']?.value;
    expect(remarks).toBe('');
  });

  it('should default Ms2MibyoDbMetadataField to string | null and require comments', () => {
    const text: Ms2MibyoDbMetadataField = { value: null, extra: [], comments: [] };
    expect(text.value).toBeNull();
    // @ts-expect-error comments is required
    const noComments: Ms2MibyoDbMetadataField<Ms2Procedure[] | null> = { value: null, extra: [] };
    expect(noComments.value).toBeNull();
  });

  it('should type array fields in grdm-files snapshots of MS2 project metadata', () => {
    const meta: Ms2ProjectRegisteredMeta = {
      schemaType: 'ms2-mibyodb',
      grdmFiles: [{ path: 'p', urlpath: 'u', metadata: { 'grdm-file:d-msr-procedure': wrap([procedure]) } }],
    };
    const procedures: Ms2Procedure[] | null | undefined =
      meta.grdmFiles?.[0].metadata['grdm-file:d-msr-procedure']?.value;
    expect(procedures).toHaveLength(1);
  });
});

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
