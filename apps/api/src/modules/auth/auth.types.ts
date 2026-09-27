import { RoleName, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string; // Identificador único (Cognito username/sub, o Azure Entra OID)
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  roles?: string[];
  [key: string]: any;
}

export interface AuthenticatedUser {
  id: string;
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: UserStatus;
  dataConsent: boolean;
  dataConsentDate?: Date | null;
  roles: RoleName[];
}
