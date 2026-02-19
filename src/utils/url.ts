/**
 * Infers the v1 API base URL from the v2 API base URL for GakuNin RDM.
 *
 * Examples:
 * https://api.rdm.nii.ac.jp/v2/ -> https://rdm.nii.ac.jp/api/v1
 * https://api.test.rdm.nii.ac.jp/v2/ -> https://test.rdm.nii.ac.jp/api/v1
 *
 * @param v2BaseUrl - The v2 API base URL.
 * @returns The inferred v1 API base URL.
 */
export function inferV1BaseUrl(v2BaseUrl: string): string {
  // Normalize by removing trailing slash
  const normalizedUrl = v2BaseUrl.endsWith('/') ? v2BaseUrl.slice(0, -1) : v2BaseUrl;

  // Pattern match for GRDM standard URL with subdomain: https://api.{subdomain}.rdm.nii.ac.jp/v2
  const grdmSubdomainPattern = /^https:\/\/api\.([^.]+)\.rdm\.nii\.ac\.jp\/v2$/;
  const subdomainMatch = normalizedUrl.match(grdmSubdomainPattern);

  if (subdomainMatch) {
    const subdomain = subdomainMatch[1];
    return `https://${subdomain}.rdm.nii.ac.jp/api/v1`;
  }

  // Pattern match for GRDM standard production URL: https://api.rdm.nii.ac.jp/v2
  const grdmPattern = /^https:\/\/api\.rdm\.nii\.ac\.jp\/v2$/;
  if (grdmPattern.test(normalizedUrl)) {
    return 'https://rdm.nii.ac.jp/api/v1';
  }

  // Fallback: replace /v2 with /api/v1 if present at the end
  if (normalizedUrl.endsWith('/v2')) {
    return normalizedUrl.substring(0, normalizedUrl.length - 3) + '/api/v1';
  }

  return normalizedUrl;
}
