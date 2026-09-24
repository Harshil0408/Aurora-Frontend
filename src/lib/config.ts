export const config = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Aurora Admin',
  accessTokenExpirySeconds: 300,
} as const;
