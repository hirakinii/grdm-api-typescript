import { inferV1BaseUrl } from '../../src/utils/url';

describe('url utility', () => {
  describe('inferV1BaseUrl', () => {
    it('should infer production v1 API URL from v2 API URL', () => {
      expect(inferV1BaseUrl('https://api.rdm.nii.ac.jp/v2/')).toBe('https://rdm.nii.ac.jp/api/v1');
    });

    it('should infer test environment v1 API URL from v2 API URL', () => {
      expect(inferV1BaseUrl('https://api.test.rdm.nii.ac.jp/v2/')).toBe('https://test.rdm.nii.ac.jp/api/v1');
    });

    it('should handle URLs without trailing slashes', () => {
      expect(inferV1BaseUrl('https://api.rdm.nii.ac.jp/v2')).toBe('https://rdm.nii.ac.jp/api/v1');
    });

    it('should replace /v2 with /api/v1 for non-GRDM URLs ending with /v2', () => {
      expect(inferV1BaseUrl('https://custom.example.com/v2/')).toBe('https://custom.example.com/api/v1');
    });

    it('should return normalized URL unchanged for URLs not ending with /v2', () => {
      expect(inferV1BaseUrl('https://custom.example.com/api/')).toBe('https://custom.example.com/api');
    });

    it('should handle staging environment', () => {
      expect(inferV1BaseUrl('https://api.staging.rdm.nii.ac.jp/v2/')).toBe('https://staging.rdm.nii.ac.jp/api/v1');
    });
  });
});
