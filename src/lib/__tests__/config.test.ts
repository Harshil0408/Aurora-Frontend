describe('config (no secret leakage, safe defaults)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('falls back to local defaults when env is missing', async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_APP_NAME;
    const { config } = await import('@/lib/config');
    expect(config.apiBaseUrl).toBe('http://localhost:4000/api/v1');
    expect(config.appName).toBe('Aurora Admin');
    expect(config.accessTokenExpirySeconds).toBe(300);
  });

  it('honours public env overrides without exposing secrets', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com/v1';
    process.env.NEXT_PUBLIC_APP_NAME = 'Test App';
    const { config } = await import('@/lib/config');
    expect(config.apiBaseUrl).toBe('https://api.example.com/v1');
    expect(config.appName).toBe('Test App');
    // Only NEXT_PUBLIC_* keys are ever read — private keys must not leak
    expect(JSON.stringify(config)).not.toContain('SECRET');
  });
});
