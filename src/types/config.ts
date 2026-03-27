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
   * May be a relative path (e.g. '/grdm-v1-api') when a custom fetch is also provided.
   */
  v1BaseUrl?: string;

  /**
   * Custom fetch function used for GRDM v1 API requests.
   *
   * Inject this to intercept or rewrite URLs before the request is sent —
   * for example, to proxy v1 API calls through a local server and avoid CORS errors.
   *
   * @example
   * ```ts
   * const grdmProxyFetch: typeof fetch = (url, init) =>
   *   fetch((url as string).replace('https://rdm.nii.ac.jp/api/v1', '/grdm-v1-api'), init);
   *
   * const client = new GrdmClient({ token, v1BaseUrl: '/grdm-v1-api', fetch: grdmProxyFetch });
   * ```
   */
  fetch?: typeof fetch;
}
