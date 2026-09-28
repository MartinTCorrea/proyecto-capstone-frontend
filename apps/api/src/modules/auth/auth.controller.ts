import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from './auth.types';
import { DevTokenDto } from './dto/dev-token.dto';
import { CognitoLoginDto } from './dto/cognito-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer-token')
  @ApiOperation({ summary: 'Obtener el perfil y roles del usuario autenticado actual' })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario autenticado obtenidos correctamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado: Token ausente, inválido o expirado',
  })
  async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return this.authService.getProfile(user.id);
  }

  @Post('dev-token')
  @Public()
  @ApiOperation({
    summary: 'Generar token de acceso JWT para pruebas y desarrollo local offline',
    description:
      'Permite generar un Bearer token con roles personalizados para simular cualquier usuario en Swagger o Postman sin depender de AWS Cognito en vivo.',
  })
  @ApiResponse({
    status: 201,
    description: 'Token JWT y perfil de usuario generados correctamente',
  })
  async generateDevToken(
    @Body() dto: DevTokenDto,
  ): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    return this.authService.generateDevToken(dto);
  }

  @Post('cognito-login')
  @Public()
  @ApiOperation({
    summary: 'Iniciar sesión directamente contra AWS Cognito User Pool',
    description:
      'Autentica un usuario con email y contraseña contra AWS Cognito (us-east-1) vía InitiateAuth, sincronizando automáticamente su perfil en PostgreSQL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa en AWS Cognito; retorna ID token y perfil sincronizado',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas en AWS Cognito o cuenta no confirmada',
  })
  @ApiResponse({
    status: 400,
    description: 'AWS Cognito no configurado en variables de entorno o desafío de contraseña requerido',
  })
  async loginCognito(
    @Body() dto: CognitoLoginDto,
  ): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    return this.authService.loginCognito(dto);
  }

  @Get('cognito-config')
  @Public()
  @ApiOperation({
    summary: 'Obtener el estado y configuración pública de AWS Cognito',
    description:
      'Indica al frontend si AWS Cognito está activo, el App Client ID público y la URL del Hosted UI si aplica.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración pública de autenticación obtenida',
  })
  getCognitoConfig(): {
    authProvider: string;
    region: string;
    userPoolId: string;
    clientId: string;
    isConfigured: boolean;
    hostedUiUrl?: string;
  } {
    return this.authService.getCognitoConfig();
  }
}
