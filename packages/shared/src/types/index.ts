import {
  RoleName,
  UserStatus,
  DayType,
  TimeBlockCode,
  AvailabilityBlock,
  MatchPlatform,
  MatchTimeBlock,
  MatchStatus,
  MatchRole,
  NominationStatus,
  ResourceType,
  ResourceVisibility,
  NotificationChannel,
  NotificationStatus,
} from '../enums';

export interface UserDto {
  id: string;
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: UserStatus;
  dataConsent: boolean;
  dataConsentDate?: Date | string | null;
  roles: RoleName[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TimeBlockConfigDto {
  id: string;
  dayType: DayType;
  blockCode: TimeBlockCode;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description?: string | null;
  isActive: boolean;
}

export interface AvailabilityDto {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  block: AvailabilityBlock;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MatchDto {
  id: string;
  externalId: string;
  platform: MatchPlatform;
  timeBlock: MatchTimeBlock;
  tournament: string;
  category: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchDateTime: Date | string;
  status: MatchStatus;
  nominations?: NominationDto[];
}

export interface NominationDto {
  id: string;
  matchId: string;
  userId: string;
  matchRole: MatchRole;
  status: NominationStatus;
  rejectionReason?: string | null;
  notifiedAt?: Date | string | null;
  respondedAt?: Date | string | null;
  user?: Partial<UserDto>;
}

export interface ResourceDto {
  id: string;
  type: ResourceType;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  content?: string | null;
  visibility: ResourceVisibility;
  createdById: string;
  createdAt: Date | string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  retryCount: number;
  sentAt?: Date | string | null;
  readAt?: Date | string | null;
  createdAt: Date | string;
}

