import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
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
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleName } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import {
  DeclareAvailabilityBulkDto,
  QueryAvailabilityDto,
  QueryAvailabilitySummaryDto,
  UpdateTimeBlockDto,
} from './dto';

@ApiTags('Availability')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('blocks')
  @ApiOperation({
    summary: 'Consultar configuración parametrizable de bloques horarios (Anexo A.4)',
    description:
      'Retorna los bloques vigentes para días laborales y fines de semana (Horario 1 y Horario 2).',
  })
  @ApiResponse({ status: 200, description: 'Configuración de bloques horarios obtenida' })
  async getTimeBlocks() {
    return this.availabilityService.getTimeBlocks();
  }

  @Patch('blocks/:id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Actualizar límites de un bloque horario parametrizado (Anexo A.4)',
    description: 'Permite a la Comisión Técnica modificar los rangos horarios de inicio y fin.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la configuración de bloque horario' })
  @ApiResponse({ status: 200, description: 'Bloque horario actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Horario inválido o startTime >= endTime' })
  @ApiResponse({ status: 404, description: 'Bloque horario no encontrado' })
  async updateTimeBlock(
    @Param('id') id: string,
    @Body() dto: UpdateTimeBlockDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.availabilityService.updateTimeBlock(id, dto, admin.id);
  }

  @Get('my')
  @Roles(RoleName.ARBITRO, RoleName.OFICIAL_MESA, RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Consultar disponibilidad declarada por el usuario autenticado (RF06)',
    description:
      'Retorna las fechas y bloques horarios declarados por el árbitro u oficial de mesa.',
  })
  @ApiResponse({ status: 200, description: 'Disponibilidad personal obtenida' })
  async getMyAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryAvailabilityDto,
  ) {
    return this.availabilityService.getMyAvailability(user.id, query);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ARBITRO, RoleName.OFICIAL_MESA, RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Declaración masiva semanal de disponibilidad (RF04, RF05)',
    description:
      'Registra la disponibilidad por día (HORARIO_1, HORARIO_2, FULL, NO). Valida cierre de plazo (Miércoles 23:59).',
  })
  @ApiResponse({ status: 200, description: 'Disponibilidad declarada exitosamente' })
  @ApiResponse({ status: 400, description: 'Plazo de declaración vencido o fecha inválida' })
  async declareBulk(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeclareAvailabilityBulkDto,
  ) {
    const isBypass = user.roles.includes(RoleName.ADMIN_COMISION_TECNICA);
    return this.availabilityService.declareBulk(user.id, dto, isBypass);
  }

  @Get('summary')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Consolidado administrativo de disponibilidad para designaciones (RF06)',
    description:
      'Permite a la Comisión Técnica consultar el personal disponible para una fecha específica y bloque.',
  })
  @ApiResponse({ status: 200, description: 'Consolidado de disponibilidad obtenido' })
  @ApiResponse({ status: 403, description: 'Acceso denegado: Exclusivo Comisión Técnica' })
  async getAvailabilitySummary(@Query() query: QueryAvailabilitySummaryDto) {
    return this.availabilityService.getAvailabilitySummary(query);
  }
}
