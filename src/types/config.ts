import { OsfClientConfig } from 'osf-api-v2-typescript';

/**
 * Configuration for the GrdmClient.
 * Extends the base OsfClientConfig with GRDM-specific options.
 */
export interface GrdmClientConfig extends OsfClientConfig {
  /**
   * Base URL for the GRDM v2 API.
   * Defaults to 'https://api.rdm.nii.ac.jp/v2/'.
   */
  baseUrl?: string;

  /**
   * Base URL for the GRDM v1 API.
   * If not provided, it is auto-inferred from baseUrl.
   */
  v1BaseUrl?: string;
}
