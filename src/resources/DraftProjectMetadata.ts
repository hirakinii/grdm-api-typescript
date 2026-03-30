import { BaseResource, TransformedResource, TransformedList } from 'osf-api-v2-typescript';
import { GrdmDraftProjectMetadataAttributes } from '../types/project-metadata';
import { parseGrdmMetaRecord } from '../utils/parseGrdmMeta';

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
   * Parse GRDM metadata from draft registration attributes.
   * Uses registration_metadata (present in draft registrations).
   * Note: registration_supplement is not available in draft registrations.
   */
  private parseGrdmMeta(attributes: GrdmDraftProjectMetadataAttributes): ReturnType<typeof parseGrdmMetaRecord> {
    const registrationMetadata = attributes.registration_metadata as Record<string, unknown> | undefined;

    if (!registrationMetadata) {
      return {};
    }

    return parseGrdmMetaRecord(registrationMetadata);
  }
}
