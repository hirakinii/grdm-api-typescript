import { GrdmClientConfig } from '../src/types/config';

describe('GrdmClientConfig', () => {
  it('should allow optional baseUrl and v1BaseUrl', () => {
    const config: GrdmClientConfig = {
      token: 'test-token',
      baseUrl: 'https://api.example.com/v2/',
      v1BaseUrl: 'https://api.example.com/v1'
    };
    expect(config.baseUrl).toBe('https://api.example.com/v2/');
    expect(config.v1BaseUrl).toBe('https://api.example.com/v1');
  });

  it('should allow omitting optional properties', () => {
    const config: GrdmClientConfig = {
      token: 'test-token'
    };
    expect(config.baseUrl).toBeUndefined();
    expect(config.v1BaseUrl).toBeUndefined();
  });
});
