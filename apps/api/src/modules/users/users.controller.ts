import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { Request } from 'express';
import {
  CreateUserDto,
  UpdateUserDto,
  AssignRolesDto,
  UpdateUserStatusDto,
  QueryUsersDto,
  DataConsentDto,
} from './dto';

@ApiTags('Users')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Crear un nuevo perfil de usuario (RF03, CU-02)',
    description:
      'Permite a la Comisión Técnica pre-registrar un árbitro, oficial de mesa o administrador con sus roles correspondientes.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Conflicto: El correo electrónico ya se encuentra registrado' })
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    return this.usersService.createUser(dto, admin.id);
  }

  @Get()
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Listar perfiles de usuario con paginación y filtros (RF03)',
    description:
      'Permite a la Comisión Técnica consultar perfiles de usuarios filtrando por rol (ARBITRO, OFICIAL_MESA), estado o término de búsqueda.',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de usuarios obtenido correctamente' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un perfil de usuario por ID (RF03)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil de usuario obtenido correctamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: No puede consultar perfiles de terceros sin rol de administrador' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    if (
      currentUser.id !== id &&
      !currentUser.roles.includes(RoleName.ADMIN_COMISION_TECNICA)
    ) {
      throw new ForbiddenException(
        'Acceso denegado: Solo el propio usuario o un Administrador de Comisión Técnica pueden consultar este perfil.',
      );
    }

    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos personales de un perfil (RF03)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Datos personales actualizados correctamente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado para editar perfiles de terceros' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    if (
      currentUser.id !== id &&
      !currentUser.roles.includes(RoleName.ADMIN_COMISION_TECNICA)
    ) {
      throw new ForbiddenException(
        'Acceso denegado: No posee permisos para modificar los datos de este usuario.',
      );
    }

    return this.usersService.updateUser(id, dto, currentUser.id);
  }

  @Patch(':id/roles')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Asignar o revocar roles técnicos a un usuario (RF02, Anexo A.1)',
    description:
      'Permite a la Comisión Técnica asignar roles de ARBITRO, OFICIAL_MESA o ADMIN. Árbitro y Oficial de Mesa son independientes.',
  })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Roles actualizados exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario o rol no encontrado' })
  async assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    return this.usersService.assignRoles(id, dto, admin.id);
  }

  @Patch(':id/status')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Habilitar o deshabilitar un perfil de usuario (RF03)',
    description:
      'Permite suspender o habilitar a un árbitro u oficial de mesa (ACTIVE, INACTIVE, PENDING_ROLE).',
  })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  @ApiResponse({ status: 200, description: 'Estado actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    return this.usersService.updateStatus(id, dto, admin.id);
  }

  @Post('consent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar consentimiento formal de tratamiento de datos personales (RF01)',
    description:
      'Registra la aceptación explícita de los términos de privacidad con marca de tiempo e IP del usuario.',
  })
  @ApiResponse({ status: 200, description: 'Consentimiento registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Validación fallida: El consentimiento debe ser true' })
  async recordConsent(
    @Body() _dto: DataConsentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<{ success: boolean; dataConsentDate: Date }> {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    return this.usersService.recordConsent(currentUser.id, ipAddress);
  }
}
