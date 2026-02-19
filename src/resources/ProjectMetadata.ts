import { BaseResource, TransformedResource, TransformedList } from 'osf-api-v2-typescript';
import {
  GrdmProjectMetadataAttributes,
  GrdmRegisteredMeta,
  GrdmRegisteredFile,
  GrdmFileMetadataField,
} from '../types/project-metadata';

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
   * Parse GRDM metadata from registration attributes
   */
  private parseGrdmMeta(attributes: GrdmProjectMetadataAttributes): GrdmRegisteredMeta {
    const meta: GrdmRegisteredMeta = {};
    const registeredMeta = attributes.registered_meta as Record<string, unknown> | undefined;

    if (!registeredMeta) {
      return meta;
    }

    const unwrap = (key: string) => {
      const field = registeredMeta[key];
      return field && typeof field === 'object' && 'value' in field ? field.value : undefined;
    };

    meta.funder = unwrap('funder') as string | undefined;
    meta.programNameJa = unwrap('program-name-ja') as string | undefined;
    meta.programNameEn = unwrap('program-name-en') as string | undefined;
    meta.projectNameJa = unwrap('project-name-ja') as string | undefined;
    meta.projectNameEn = unwrap('project-name-en') as string | undefined;
    meta.japanGrantNumber = unwrap('japan-grant-number') as string | undefined;
    meta.fundingStreamCode = unwrap('funding-stream-code') as string | undefined;
    meta.projectResearchField = unwrap('project-research-field') as string | undefined;
    meta.registrationSupplement = attributes.registration_supplement as string | undefined;

    const grdmFilesJson = unwrap('grdm-files');
    if (typeof grdmFilesJson === 'string' && grdmFilesJson) {
      try {
        const files = JSON.parse(grdmFilesJson) as Record<string, unknown>[];
        meta.grdmFiles = this.parseGrdmFiles(files);
      } catch {
        // Ignore parse errors
      }
    }

    return meta;
  }

  /**
   * Parse grdm-files metadata and handle snake_case to camelCase conversion for creators
   */
  private parseGrdmFiles(files: Record<string, unknown>[]): GrdmRegisteredFile[] {
    return files.map((file) => {
      const metadata = { ...(file.metadata as Record<string, GrdmFileMetadataField>) };

      // Convert creators if present
      const creatorField = metadata['grdm-file:creators'];
      if (creatorField?.value) {
        const creators = creatorField.value;
        if (Array.isArray(creators)) {
          creatorField.value = creators.map((c: unknown) => {
            const creator = c as Record<string, unknown>;
            return {
              number: (creator.number as string) || null,
              nameJa: (creator.name_ja as string) || null,
              nameEn: (creator.name_en as string) || null,
            };
          });
        }
      }

      return {
        path: file.path as string,
        urlpath: file.urlpath as string,
        metadata,
      };
    });
  }
}
