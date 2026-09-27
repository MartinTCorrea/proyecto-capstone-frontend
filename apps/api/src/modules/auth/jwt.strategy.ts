import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtPayload, AuthenticatedUser } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const authProvider = configService.get<string>('AUTH_PROVIDER', 'cognito').toLowerCase();
    const jwtSecret = configService.get<string>('JWT_SECRET', 'sgaob_jwt_dev_secret_key_2026');

    let jwksUri: string | undefined;
    let issuer: string | undefined;

    if (authProvider === 'cognito') {
      const region = configService.get<string>('AWS_REGION', 'us-east-1');
      const userPoolId = configService.get<string>('COGNITO_USER_POOL_ID', '');
      jwksUri =
        configService.get<string>('COGNITO_JWKS_URI') ||
        (userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json` : undefined);
      issuer = userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}` : undefined;
    } else if (authProvider === 'azure') {
      jwksUri = configService.get<string>('AZURE_JWKS_URI');
      issuer = configService.get<string>('AZURE_ISSUER_URL');
    }

    // Configuración híbrida: Si se definió un JWKS URI válido (en nube), valida con RS256 vía JWKS.
    // De lo contrario (o en modo local), valida con secret simétrico HS256 para desarrollo sin dependencias externas.
    const strategyOptions =
      jwksUri && !jwksUri.includes('example')
        ? {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
              cache: true,
              rateLimit: true,
              jwksRequestsPerMinute: 10,
              jwksUri,
            }),
            issuer,
            algorithms: ['RS256'],
          }
        : {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
            algorithms: ['HS256', 'RS256'],
          };

    super(strategyOptions);
    this.logger.log(
      `Estrategia JWT configurada [Proveedor: ${authProvider.toUpperCase()}] — Modo: ${
        jwksUri && !jwksUri.includes('example') ? 'Validación JWKS Cloud' : 'Firma Local / Dev'
      }`,
    );
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return this.authService.validateOrCreateUser(payload);
  }
}
