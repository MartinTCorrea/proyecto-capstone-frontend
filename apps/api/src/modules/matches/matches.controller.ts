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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import {
  CreateMatchDto,
  UpdateMatchDto,
  QueryMatchesDto,
  SyncMatchesDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleName, MatchPlatform } from '@sgaob/shared';

@ApiTags('matches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @Roles(RoleName.ADMIN_COMISION_TECNICA, RoleName.ARBITRO, RoleName.OFICIAL_MESA)
  @ApiOperation({
    summary: 'Listar cartelera de partidos con filtros y paginación',
    description: 'Permite consultar partidos programados por rango de fechas, torneo, recinto o estado.',
  })
  @ApiResponse({ status: 200, description: 'Listado de partidos obtenido exitosamente' })
  async getMatches(@Query() query: QueryMatchesDto) {
    return this.matchesService.getMatches(query);
  }

  @Get('integrations/test')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Probar conectividad con plataformas de sincronización (RF07)',
  })
  @ApiQuery({ name: 'platform', enum: MatchPlatform, required: false })
  async testIntegration(@Query('platform') platform?: MatchPlatform) {
    return this.matchesService.testIntegration(platform || MatchPlatform.SWISH);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA, RoleName.ARBITRO, RoleName.OFICIAL_MESA)
  @ApiOperation({ summary: 'Obtener detalle de un partido específico por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de partido obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Partido no encontrado' })
  async getMatchById(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchesService.getMatchById(id);
  }

  @Post()
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Crear un partido manualmente (Comisión Técnica / 100% Autónomo)',
    description: 'Permite registrar partidos de ligas locales o escolares sin depender de plataformas externas.',
  })
  @ApiResponse({ status: 201, description: 'Partido creado exitosamente' })
  async createMatch(
    @Body() dto: CreateMatchDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.matchesService.createMatch(dto, adminId);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Actualizar horario, recinto o estado de un partido (RF10)',
    description: 'Si el partido es reprogramado, suspendido o cancelado, alerta automáticamente a los árbitros nominados.',
  })
  @ApiResponse({ status: 200, description: 'Partido actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Partido no encontrado' })
  async updateMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMatchDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.matchesService.updateMatch(id, dto, adminId);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({ summary: 'Eliminar un partido creado manualmente' })
  @ApiResponse({ status: 200, description: 'Partido eliminado exitosamente' })
  async deleteMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.matchesService.deleteMatch(id, adminId);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Disparar sincronización de partidos bajo demanda (RF09)',
    description: 'Encola la tarea de sincronización en BullMQ o la procesa asíncronamente con reintentos.',
  })
  @ApiResponse({ status: 200, description: 'Sincronización encolada exitosamente' })
  async triggerSync(
    @Body() dto: SyncMatchesDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.matchesService.triggerSync(dto, adminId);
  }
}
