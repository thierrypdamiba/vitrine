import Arcade from '@arcadeai/arcadejs';

type Environment = Record<string, string | undefined>;

export type ArcadeConfig = {
  apiKey: string;
  userId: string;
  baseURL?: string;
  contextQuery: string;
};

export type ArcadeTools = Pick<Arcade['tools'], 'authorize' | 'execute' | 'get'>;

export const DEFAULT_ARCADE_CONTEXT_QUERY =
  'newer_than:120d (jacket OR scotland OR gift OR trip OR waterproof)';

export class ArcadeAuthorizationRequired extends Error {
  readonly url?: string;

  constructor(url?: string) {
    super('Arcade authorization is required');
    this.name = 'ArcadeAuthorizationRequired';
    this.url = url;
  }
}

export class ArcadeContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArcadeContextError';
  }
}

export function readArcadeConfig(environment: Environment = process.env): ArcadeConfig | null {
  const apiKey = environment.ARCADE_API_KEY?.trim();
  const userId = environment.ARCADE_USER_ID?.trim();
  if (!apiKey || !userId) return null;

  return {
    apiKey,
    userId,
    baseURL: environment.ARCADE_BASE_URL?.trim() || undefined,
    contextQuery: environment.ARCADE_CONTEXT_QUERY?.trim() || DEFAULT_ARCADE_CONTEXT_QUERY,
  };
}

export function createArcadeTools(config: ArcadeConfig): ArcadeTools {
  return new Arcade({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    logLevel: 'off',
    maxRetries: 1,
    timeout: 20_000,
  }).tools;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
