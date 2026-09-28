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

    if (authProvider === 'cognito') {
      const region = configService.get<string>('AWS_REGION', 'us-east-1');
      const userPoolId = configService.get<string>('COGNITO_USER_POOL_ID', '');
      jwksUri =
        configService.get<string>('COGNITO_JWKS_URI') ||
        (userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json` : undefined);
    } else if (authProvider === 'azure') {
      jwksUri = configService.get<string>('AZURE_JWKS_URI');
    }

    const isCloudConfigured = !!(jwksUri && !jwksUri.includes('example'));

    // Configuración híbrida inteligente:
    // Si hay un JWKS URI válido (Cognito configurado en la nube), inspecciona el header del token JWT.
    // - Si alg === 'HS256', lo valida con la clave local (permite tokens de prueba dev y suites e2e).
    // - Si alg === 'RS256', lo valida criptográficamente con el JWKS de AWS Cognito.
    const keyProvider = isCloudConfigured
      ? (request: any, rawJwtToken: any, done: (err: any, secretOrKey?: string | Buffer) => void) => {
          try {
            const tokenStr = typeof rawJwtToken === 'string' ? rawJwtToken : '';
            const parts = tokenStr.split('.');
            if (parts.length === 3) {
              const headerJson = Buffer.from(parts[0], 'base64').toString('utf8');
              const header = JSON.parse(headerJson);
              if (header.alg === 'HS256') {
                return done(null, jwtSecret);
              }
            }
          } catch {
            // Continúa a validación JWKS si no es HS256
          }

          const jwksHandler = passportJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
            jwksUri: jwksUri!,
          });

          return jwksHandler(request, rawJwtToken, done);
        }
      : undefined;

    const strategyOptions = keyProvider
      ? {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKeyProvider: keyProvider,
          algorithms: ['RS256', 'HS256'],
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
        isCloudConfigured ? 'Híbrido (AWS Cognito RS256 JWKS + Dev Local HS256)' : 'Firma Local / Dev HS256'
      }`,
    );
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return this.authService.validateOrCreateUser(payload);
  }
}
