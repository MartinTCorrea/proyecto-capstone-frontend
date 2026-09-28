import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType, ResourceVisibility } from '@sgaob/shared';

export class QueryResourcesDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de recurso (DOCUMENTO, CREDENCIAL, COMUNICADO)',
    enum: ResourceType,
  })
  @IsOptional()
  @IsEnum(ResourceType, {
    message: 'El tipo debe ser DOCUMENTO, CREDENCIAL o COMUNICADO',
  })
  type?: ResourceType;

  @ApiPropertyOptional({
    description: 'Filtrar por visibilidad explícita (solo administradores pueden consultar visibilidad ADMIN)',
    enum: ResourceVisibility,
  })
  @IsOptional()
  @IsEnum(ResourceVisibility, {
    message: 'La visibilidad debe ser PUBLIC, AUTHENTICATED o ADMIN',
  })
  visibility?: ResourceVisibility;

  @ApiPropertyOptional({
    description: 'Término de búsqueda textual en título, descripción o contenido',
    example: 'FIBA',
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser texto' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number = 20;
}
