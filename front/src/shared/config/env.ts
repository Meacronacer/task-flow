const env = (import.meta as ImportMeta & {
  env: Record<string, string | undefined>;
}).env;

export const ENV = {
  apiUrl: env['VITE_API_URL'] ?? 'http://localhost:3000',
  wsUrl: env['VITE_WS_URL'] ?? 'http://localhost:3000',
} as const;