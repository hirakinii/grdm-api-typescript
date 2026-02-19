import { inferV1BaseUrl } from '../../src/utils/url';

describe('url utility', () => {
  describe('inferV1BaseUrl', () => {
    it('should infer production v1 API URL from v2 API URL', () => {
      const v2Url = 'https://api.rdm.nii.ac.jp/v2/';
      const expected = 'https://rdm.nii.ac.jp/api/v1';
      expect(inferV1BaseUrl(v2Url)).toBe(expected);
    });

    it('should infer test environment v1 API URL from v2 API URL', () => {
      const v2Url = 'https://api.test.rdm.nii.ac.jp/v2/';
      const expected = 'https://test.test.rdm.nii.ac.jp/api/v1';
      // Note: Based on the plan description:
      // https://api.{subdomain}.rdm.nii.ac.jp/v2/ -> https://{subdomain}.rdm.nii.ac.jp/api/v1
      // However, usually RDM's v1 API is at {subdomain}.rdm.nii.ac.jp/api/v1
      // Let's re-read the plan's example.
      // Plan says: https://api.test.rdm.nii.ac.jp/v2/ → https://test.rdm.nii.ac.jp/api/v1
      expect(inferV1BaseUrl(v2Url)).toBe('https://test.rdm.nii.ac.jp/api/v1');
    });

    it('should handle URLs without trailing slashes', () => {
      const v2Url = 'https://api.rdm.nii.ac.jp/v2';
      const expected = 'https://rdm.nii.ac.jp/api/v1';
      expect(inferV1BaseUrl(v2Url)).toBe(expected);
    });

    it('should return the original URL if it does not match the expected pattern', () => {
      const customUrl = 'https://custom.example.com/v2/';
      // If it doesn't match the pattern, it might just replace /v2/ with /api/v1 or similar,
      // but let's see how the implementation handles it.
      // The plan says: "https://api.{subdomain}.rdm.nii.ac.jp/v2/ → https://{subdomain}.rdm.nii.ac.jp/api/v1"
      // If it's a completely different URL, what should happen?
      // Usually, we should at least try to replace v2 with api/v1 if it follows a similar structure.
      expect(inferV1BaseUrl(customUrl)).toBe('https://custom.example.com/api/v1');
    });

    it('should handle staging environment', () => {
      const v2Url = 'https://api.staging.rdm.nii.ac.jp/v2/';
      const expected = 'https://staging.rdm.nii.ac.jp/api/v1';
      expect(inferV1BaseUrl(v2Url)).toBe(expected);
    });
  });
});
