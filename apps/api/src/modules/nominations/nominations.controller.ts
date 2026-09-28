import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NominationsService } from './nominations.service';
import {
  CreateNominationDto,
  RespondNominationDto,
  QueryNominationsDto,
  QueryCandidatesDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleName } from '@sgaob/shared';

@ApiTags('nominations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('nominations')
export class NominationsController {
  constructor(private readonly nominationsService: NominationsService) {}

  @Get()
  @Roles(RoleName.ADMIN_COMISION_TECNICA, RoleName.ARBITRO, RoleName.OFICIAL_MESA)
  @ApiOperation({
    summary: 'Listar nominaciones con filtros y paginación (RF16)',
    description: 'Permite consultar asignaciones por partido, usuario, estado (PENDING, CONFIRMED, REJECTED) o rango de fechas.',
  })
  @ApiResponse({ status: 200, description: 'Listado de nominaciones obtenido exitosamente' })
  async getNominations(
    @Query() query: QueryNominationsDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('roles') userRoles: RoleName[],
  ) {
    return this.nominationsService.getNominations(query, currentUserId, userRoles || []);
  }

  @Get('available-candidates')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Consultar personal disponible y acreditado para un slot (CU-07, Paso 2)',
    description: 'Aplica el cruce inteligente de disponibilidad (RF12), rol técnico requerido (Anexo A.1) y detección de conflictos de horario.',
  })
  @ApiResponse({ status: 200, description: 'Candidatos clasificados entre disponibles y no disponibles' })
  async getAvailableCandidates(@Query() query: QueryCandidatesDto) {
    return this.nominationsService.getAvailableCandidates(query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA, RoleName.ARBITRO, RoleName.OFICIAL_MESA)
  @ApiOperation({ summary: 'Obtener detalle de una nominación específica por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de nominación obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Nominación no encontrada' })
  async getNominationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.nominationsService.getNominationById(id);
  }

  @Post()
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Asignar árbitro u oficial de mesa a un partido (RF11, RF12, RF13, Anexo A.1, A.2)',
    description: 'Aplica validación dura de rol y disponibilidad, despachando notificación formal por correo electrónico (RF14).',
  })
  @ApiResponse({ status: 201, description: 'Nominación creada y notificación despachada' })
  @ApiResponse({ status: 400, description: 'Fallo de validación de rol, disponibilidad o regla de negocio' })
  @ApiResponse({ status: 409, description: 'Conflicto: slot ocupado o usuario ya asignado al partido' })
  async createNomination(
    @Body() dto: CreateNominationDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.nominationsService.createNomination(dto, adminId);
  }

  @Patch(':id/respond')
  @Roles(RoleName.ADMIN_COMISION_TECNICA, RoleName.ARBITRO, RoleName.OFICIAL_MESA)
  @ApiOperation({
    summary: 'Responder a una nominación: Confirmar o Rechazar (RF15, CU-08)',
    description: 'El árbitro nominado o la Comisión Técnica actualiza el estado. Si se rechaza, es obligatorio ingresar un motivo.',
  })
  @ApiResponse({ status: 200, description: 'Respuesta de nominación registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Motivo de rechazo faltante o inválido' })
  @ApiResponse({ status: 403, description: 'Intento de responder una nominación ajena' })
  async respondNomination(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondNominationDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('roles') userRoles: RoleName[],
  ) {
    const isAdmin = (userRoles || []).includes(RoleName.ADMIN_COMISION_TECNICA);
    return this.nominationsService.respondNomination(id, dto, currentUserId, isAdmin);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Desasignar / revocar una nominación (Comisión Técnica)',
    description: 'Elimina la designación liberando el slot correspondiente para reasignación.',
  })
  @ApiResponse({ status: 200, description: 'Nominación revocada exitosamente' })
  async deleteNomination(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.nominationsService.deleteNomination(id, adminId);
  }
}
