import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import {
  CreateResourceDto,
  UpdateResourceDto,
  QueryResourcesDto,
  ExportNominationsDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleName } from '@sgaob/shared';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @Roles(RoleName.ADMIN_COMISION_TECNICA, RoleName.ARBITRO, RoleName.OFICIAL_MESA)
  @ApiOperation({
    summary: 'Listar recursos, comunicados y documentos (RF17, RF18, RF19)',
    description:
      'Permite consultar recursos y comunicados con filtro de visibilidad automática según el rol del usuario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Listado de recursos obtenido exitosamente' })
  async getResources(
    @Query() query: QueryResourcesDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('roles') userRoles: RoleName[],
  ) {
    return this.resourcesService.getResources(query, currentUserId, userRoles || []);
  }

  @Get('export/nominations')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Exportar grilla de asignaciones a CSV compatible con Excel (RF20, CU-09)',
    description:
      'Genera y descarga un archivo CSV con UTF-8 BOM que contiene el detalle completo de partidos, ternas arbitrales y oficiales de mesa.',
  })
  @ApiResponse({ status: 200, description: 'Archivo CSV descargado exitosamente' })
  async exportNominations(
    @Query() query: ExportNominationsDto,
    @Res() res: Response,
  ) {
    const result = await this.resourcesService.exportNominationsCsv(query);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.csvContent);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA, RoleName.ARBITRO, RoleName.OFICIAL_MESA)
  @ApiOperation({ summary: 'Obtener detalle de un recurso específico por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de recurso obtenido exitosamente' })
  @ApiResponse({ status: 403, description: 'Prohibido: recurso restringido a administradores' })
  @ApiResponse({ status: 404, description: 'Recurso no encontrado' })
  async getResourceById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('roles') userRoles: RoleName[],
  ) {
    return this.resourcesService.getResourceById(id, currentUserId, userRoles || []);
  }

  @Post()
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({
    summary: 'Crear un nuevo recurso, comunicado o credencial (RF17, RF18, RF19, Anexo A.5)',
    description:
      'Comisión Técnica da de alta documentos o comunicados. Si el tipo es CREDENCIAL, se fuerza incondicionalmente visibilidad ADMIN.',
  })
  @ApiResponse({ status: 201, description: 'Recurso creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async createResource(
    @Body() dto: CreateResourceDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.resourcesService.createResource(dto, adminId);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({ summary: 'Actualizar un recurso existente (Comisión Técnica)' })
  @ApiResponse({ status: 200, description: 'Recurso actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Recurso no encontrado' })
  async updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.resourcesService.updateResource(id, dto, adminId);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN_COMISION_TECNICA)
  @ApiOperation({ summary: 'Eliminar un recurso (Comisión Técnica)' })
  @ApiResponse({ status: 200, description: 'Recurso eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Recurso no encontrado' })
  async deleteResource(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.resourcesService.deleteResource(id, adminId);
  }
}
