import { BaseResource, TransformedResource, TransformedList } from 'osf-api-v2-typescript';
import {
  GrdmDraftProjectMetadataAttributes,
  GrdmParsedMeta,
  GrdmRegistrationSchemaRelationship,
} from '../types/project-metadata';
import { SCHEMA_ID_MS2_MIBYODB } from '../types/schema-ids';
import { parseGrdmMetaRecord, parseMs2ProjectMetaRecord } from '../utils/parseGrdmMeta';

/**
 * Resource class for GakuNin RDM Project Metadata via Draft Registrations (v2 API)
 */
export class DraftProjectMetadata extends BaseResource {
  /**
   * List draft registrations for a node and parse GRDM metadata
   *
   * @param nodeId - ID of the node to list draft registrations for
   * @param params - Optional query parameters
   */
  async listByNode(
    nodeId: string,
    params?: Record<string, unknown>,
  ): Promise<TransformedList<GrdmDraftProjectMetadataAttributes>> {
    const endpoint = `nodes/${nodeId}/draft_registrations/`;
    const result = await this.list<GrdmDraftProjectMetadataAttributes>(endpoint, params);

    result.data = result.data.map((item) => ({
      ...item,
      grdmMeta: this.parseGrdmMeta(item),
    }));

    return result;
  }

  /**
   * Get a single draft registration by ID and parse GRDM metadata
   *
   * @param draftId - ID of the draft registration to fetch
   */
  async getById(draftId: string): Promise<TransformedResource<GrdmDraftProjectMetadataAttributes>> {
    const endpoint = `draft_registrations/${draftId}/`;
    const result = await this.get<GrdmDraftProjectMetadataAttributes>(endpoint);

    result.grdmMeta = this.parseGrdmMeta(result);

    return result;
  }

  /**
   * Parse GRDM metadata from a draft registration transformed resource.
   * Dispatches to the appropriate parser based on registration_schema.data.id
   * from the GRDM-extended relationships field.
   *
   * - Schema ① (public-funding): parseGrdmMetaRecord
   * - Schema ② (ms2-mibyodb): parseMs2ProjectMetaRecord
   */
  private parseGrdmMeta(item: TransformedResource<GrdmDraftProjectMetadataAttributes>): GrdmParsedMeta {
    const registrationMetadata = item.registration_metadata as Record<string, unknown> | undefined;

    if (!registrationMetadata) {
      return { schemaType: 'public-funding' };
    }

    const schemaRelationship = item.relationships?.['registration_schema'] as
      | GrdmRegistrationSchemaRelationship
      | undefined;
    const schemaId = schemaRelationship?.data?.id;

    if (schemaId === SCHEMA_ID_MS2_MIBYODB) {
      return parseMs2ProjectMetaRecord(registrationMetadata);
    }

    return parseGrdmMetaRecord(registrationMetadata);
  }
}
