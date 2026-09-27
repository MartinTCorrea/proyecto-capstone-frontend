import { MatchPlatform, MatchStatus } from '@sgaob/shared';

export interface ExternalMatch {
  externalId: string;
  platform: MatchPlatform;
  tournament: string;
  category: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchDateTime: Date;
  status: MatchStatus;
  rawMetadata?: Record<string, any>;
}

export interface MatchSyncProvider {
  readonly platform: MatchPlatform;
  testConnection(): Promise<{ success: boolean; message: string }>;
  fetchMatches(options?: { fromDate?: Date; toDate?: Date }): Promise<ExternalMatch[]>;
}
