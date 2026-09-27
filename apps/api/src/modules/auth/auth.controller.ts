import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from './auth.types';
import { DevTokenDto } from './dto/dev-token.dto';

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
}
