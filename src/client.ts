import { OsfClient } from 'osf-api-v2-typescript';
import { GrdmClientConfig } from './types/config';
import { ProjectMetadata } from './resources/ProjectMetadata';
import { DraftProjectMetadata } from './resources/DraftProjectMetadata';
import { FileMetadata } from './resources/FileMetadata';
import { GrdmFiles } from './resources/GrdmFiles';
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
  /** The v1 API base URL (auto-inferred or explicitly provided; may be relative when customFetch is set) */
  readonly v1BaseUrl: string;

  private _projectMetadata?: ProjectMetadata;
  private _draftProjectMetadata?: DraftProjectMetadata;
  private _fileMetadata?: FileMetadata;
  private _grdmFiles?: GrdmFiles;

  private readonly customFetch?: typeof fetch;
  private readonly v1TokenProvider?: () => string | Promise<string>;

  /**
   * Create a new GrdmClient
   *
   * @param config - Client configuration. baseUrl defaults to 'https://api.rdm.nii.ac.jp/v2/'
   */
  constructor(config: GrdmClientConfig = {}) {
    const baseUrl = config.baseUrl ?? 'https://api.rdm.nii.ac.jp/v2/';
    const v1BaseUrl = config.v1BaseUrl ?? inferV1BaseUrl(baseUrl);
    // Only add v1 host to allowedHosts when v1BaseUrl is an absolute URL.
    // A relative path (proxy route) does not require host allowlisting.
    const allowedHosts = [...(config.allowedHosts ?? [])];
    if (v1BaseUrl.startsWith('http')) {
      allowedHosts.push(new URL(v1BaseUrl).hostname);
    }
    super({ ...config, baseUrl, allowedHosts });
    this.v1BaseUrl = v1BaseUrl;
    this.customFetch = config.fetch;
    if (config.token) {
      const token = config.token;
      this.v1TokenProvider = () => token;
    } else if (config.tokenProvider) {
      this.v1TokenProvider = config.tokenProvider;
    } else if (config.oauth2Client) {
      this.v1TokenProvider = () => config.oauth2Client!.getAccessToken();
    }
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
   * Access the DraftProjectMetadata resource (GRDM v2 API)
   *
   * Provides methods for fetching and parsing GRDM project metadata
   * from OSF draft registrations.
   */
  get draftProjectMetadata(): DraftProjectMetadata {
    if (!this._draftProjectMetadata) {
      this._draftProjectMetadata = new DraftProjectMetadata(this.httpClient);
    }
    return this._draftProjectMetadata;
  }

  /**
   * Access the FileMetadata resource (GRDM v1 API)
   *
   * Provides methods for fetching file metadata from the GRDM v1 API.
   */
  get fileMetadata(): FileMetadata {
    if (!this._fileMetadata) {
      this._fileMetadata = new FileMetadata(this.httpClient, this.v1BaseUrl, this.customFetch, this.v1TokenProvider);
    }
    return this._fileMetadata;
  }

  /**
   * Access the GrdmFiles resource (GRDM v2 Files API)
   *
   * Provides methods for listing files and navigating subfolders within
   * a node's storage provider, including lazy-load subfolder expansion
   * via listByPath() and listByPathPaginated().
   */
  get grdmFiles(): GrdmFiles {
    if (!this._grdmFiles) {
      this._grdmFiles = new GrdmFiles(this.httpClient);
    }
    return this._grdmFiles;
  }
}
