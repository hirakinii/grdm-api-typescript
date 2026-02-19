import { HttpClient } from 'osf-api-v2-typescript';
import { GrdmFileMetadataResponse, GrdmFileItem, GrdmFileMetadataSchema } from '../types/file-metadata';

/**
 * Resource class for GakuNin RDM File Metadata (v1 API)
 */
export class FileMetadata {
  /**
   * Create a new FileMetadata resource instance
   *
   * @param httpClient - HTTP client from the OsfClient/GrdmClient
   * @param v1BaseUrl - Base URL for the v1 API
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly v1BaseUrl: string,
  ) {}

  /**
   * Get file metadata for a project from the v1 API
   *
   * @param projectId - ID of the project (node)
   */
  async getByProject(projectId: string): Promise<GrdmFileMetadataResponse> {
    const baseUrl = this.v1BaseUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/project/${projectId}/metadata/project`;
    return this.httpClient.get<GrdmFileMetadataResponse>(endpoint);
  }

  /**
   * Find a specific file's metadata by its path
   *
   * @param projectId - ID of the project
   * @param path - Path of the file (e.g., 'osfstorage/README.md')
   */
  async findFileByPath(projectId: string, path: string): Promise<GrdmFileItem | undefined> {
    const response = await this.getByProject(projectId);
    return response.data.attributes.files.find((file) => file.path === path);
  }

  /**
   * Get the active metadata schema for a specific file
   *
   * @param projectId - ID of the project
   * @param path - Path of the file
   */
  async getActiveMetadata(projectId: string, path: string): Promise<GrdmFileMetadataSchema | undefined> {
    const file = await this.findFileByPath(projectId, path);
    if (!file || !file.items) {
      return undefined;
    }
    return file.items.find((item) => item.active);
  }
}
