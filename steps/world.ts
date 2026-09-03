/**
 * Shared world for safeword's BDD acceptance lane. Each scenario gets a fresh
 * instance; step definitions stash the last command result here. Extend this
 * class with your own state as your features grow.
 */

import { setWorldConstructor, World } from '@cucumber/cucumber';

import type {
  CatalogItem,
  PrivateContext,
  PublicBrief,
  VitrineSearchResult,
  VitrineView,
} from '../lib/vitrine.ts';
import type { JsonSchema, ModelContextTool } from '../lib/webmcp.ts';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class SafewordWorld extends World {
  result: CommandResult = { stdout: '', stderr: '', exitCode: 0 };
  privateContext?: PrivateContext;
  catalogRequest?: unknown;
  adapterStatus?: number;
  adapterBody?: { error?: string; receipt?: PublicBrief; items?: CatalogItem[] };
  searchResult?: VitrineSearchResult;
  ranking?: CatalogItem[];
  catalogItems?: CatalogItem[];
  entryResults?: Record<string, VitrineSearchResult>;
  seamView?: VitrineView;
  registeredTool?: ModelContextTool;
  toolSchema?: JsonSchema;
}

setWorldConstructor(SafewordWorld);
