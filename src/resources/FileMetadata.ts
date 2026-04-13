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
   * @param v1BaseUrl - Base URL for the v1 API (may be a relative path when customFetch is provided)
   * @param customFetch - Optional custom fetch function; when provided, bypasses httpClient for v1 requests
   * @param tokenProvider - Token provider used to add Authorization headers when customFetch is set
   */
  constructor(
    private readonly httpClient: HttpClient,
    private readonly v1BaseUrl: string,
    private readonly customFetch?: typeof fetch,
    private readonly tokenProvider?: () => string | Promise<string>,
  ) {}

  /**
   * Get file metadata for a project from the v1 API
   *
   * @param projectId - ID of the project (node)
   */
  async getByProject(projectId: string): Promise<GrdmFileMetadataResponse> {
    const baseUrl = this.v1BaseUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/project/${projectId}/metadata/project`;

    if (this.customFetch && this.tokenProvider) {
      const token = await this.tokenProvider();
      const response = await this.customFetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<GrdmFileMetadataResponse>;
    }

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

  /**
   * Update file metadata for a specific file via the v1 PATCH API.
   * The target file is determined by `fileItem.path` (e.g. "osfstorage/README.md").
   *
   * @param projectId - ID of the project (node)
   * @param fileItem - GrdmFileItem containing the updated metadata to send
   */
  async updateFileMetadata(projectId: string, fileItem: GrdmFileItem): Promise<void> {
    const baseUrl = this.v1BaseUrl.replace(/\/$/, '');
    const slashIndex = fileItem.path.indexOf('/');
    const storageProvider = fileItem.path.slice(0, slashIndex);
    const fileName = fileItem.path.slice(slashIndex + 1);
    const endpoint = `${baseUrl}/project/${projectId}/metadata/files/${storageProvider}/${fileName}`;

    if (this.customFetch && this.tokenProvider) {
      const token = await this.tokenProvider();
      const response = await this.customFetch(endpoint, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileItem),
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status} ${response.statusText}`);
      }
      return;
    }

    await this.httpClient.patch<void>(endpoint, fileItem);
  }
}
