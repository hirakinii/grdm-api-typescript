import { OsfClient } from 'osf-api-v2-typescript';
import { GrdmClientConfig } from './types/config';
import { ProjectMetadata } from './resources/ProjectMetadata';
import { FileMetadata } from './resources/FileMetadata';
import { inferV1BaseUrl } from './utils/url';

/**
 * GakuNin RDM API client.
 *
 * Extends OsfClient with GRDM-specific resources:
 * - projectMetadata: access to v2 project metadata (registrations)
 * - fileMetadata: access to v1 file metadata
 *
 * All 22 OSF resources from OsfClient are available via inheritance.
 *
 * @example
 * ```typescript
 * const client = new GrdmClient({ token: 'your-token' });
 * const meta = await client.projectMetadata.listByNode('abc12');
 * ```
 */
export class GrdmClient extends OsfClient {
  /** The v1 API base URL (auto-inferred or explicitly provided) */
  readonly v1BaseUrl: string;

  private _projectMetadata?: ProjectMetadata;
  private _fileMetadata?: FileMetadata;

  /**
   * Create a new GrdmClient
   *
   * @param config - Client configuration. baseUrl defaults to 'https://api.rdm.nii.ac.jp/v2/'
   */
  constructor(config: GrdmClientConfig = {}) {
    const baseUrl = config.baseUrl ?? 'https://api.rdm.nii.ac.jp/v2/';
    const v1BaseUrl = config.v1BaseUrl ?? inferV1BaseUrl(baseUrl);
    // Allow the v1 API host in addition to the v2 API host
    const v1Host = new URL(v1BaseUrl).hostname;
    const allowedHosts = [...(config.allowedHosts ?? []), v1Host];
    super({ ...config, baseUrl, allowedHosts });
    this.v1BaseUrl = v1BaseUrl;
  }

  /**
   * Access the ProjectMetadata resource (GRDM v2 API)
   *
   * Provides methods for fetching and parsing GRDM project metadata
   * from OSF registrations.
   */
  get projectMetadata(): ProjectMetadata {
    if (!this._projectMetadata) {
      this._projectMetadata = new ProjectMetadata(this.httpClient);
    }
    return this._projectMetadata;
  }

  /**
   * Access the FileMetadata resource (GRDM v1 API)
   *
   * Provides methods for fetching file metadata from the GRDM v1 API.
   */
  get fileMetadata(): FileMetadata {
    if (!this._fileMetadata) {
      this._fileMetadata = new FileMetadata(this.httpClient, this.v1BaseUrl);
    }
    return this._fileMetadata;
  }
}
