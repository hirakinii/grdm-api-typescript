import { BaseResource, TransformedResource, TransformedList } from 'osf-api-v2-typescript';
import { GrdmProjectMetadataAttributes } from '../types/project-metadata';
import { parseGrdmMetaRecord } from '../utils/parseGrdmMeta';

/**
 * Resource class for GakuNin RDM Project Metadata (v2 API)
 */
export class ProjectMetadata extends BaseResource {
  /**
   * List registrations for a node and parse GRDM metadata
   *
   * @param nodeId - ID of the node to list registrations for
   * @param params - Optional query parameters
   */
  async listByNode(
    nodeId: string,
    params?: Record<string, unknown>,
  ): Promise<TransformedList<GrdmProjectMetadataAttributes>> {
    const endpoint = `nodes/${nodeId}/registrations/`;
    const result = await this.list<GrdmProjectMetadataAttributes>(endpoint, params);

    result.data = result.data.map((item) => ({
      ...item,
      grdmMeta: this.parseGrdmMeta(item),
    }));

    return result;
  }

  /**
   * Get a single registration by ID and parse GRDM metadata
   *
   * @param registrationId - ID of the registration to fetch
   */
  async getById(registrationId: string): Promise<TransformedResource<GrdmProjectMetadataAttributes>> {
    const endpoint = `registrations/${registrationId}/`;
    const result = await this.get<GrdmProjectMetadataAttributes>(endpoint);

    result.grdmMeta = this.parseGrdmMeta(result);

    return result;
  }

  /**
   * Parse GRDM metadata from registration attributes.
   * Uses registered_meta (present in registrations) and registration_supplement
   * (a direct attribute field available only in registrations).
   */
  private parseGrdmMeta(attributes: GrdmProjectMetadataAttributes): ReturnType<typeof parseGrdmMetaRecord> {
    const registeredMeta = attributes.registered_meta as Record<string, unknown> | undefined;

    if (!registeredMeta) {
      return { schemaType: 'public-funding' };
    }

    const meta = parseGrdmMetaRecord(registeredMeta);
    meta.registrationSupplement = attributes.registration_supplement as string | undefined;
    return meta;
  }
}
