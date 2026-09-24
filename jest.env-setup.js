// Force offline, deterministic env BEFORE any app module loads.
// Points API at an unroutable address so a missing mock fails fast
// instead of leaking credentials to a real backend.
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://127.0.0.1:1/api/v1';
process.env.NEXT_PUBLIC_APP_NAME = 'Aurora Admin (test)';
process.env.TZ = 'UTC';
