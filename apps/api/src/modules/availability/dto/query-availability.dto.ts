import { IsOptional, IsISO8601, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityBlock, RoleName } from '@prisma/client';

export class QueryAvailabilityDto {
  @ApiPropertyOptional({ example: '2026-10-01', description: 'Fecha de inicio del rango (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-07', description: 'Fecha de término del rango (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}

export class QueryAvailabilitySummaryDto {
  @ApiProperty({ example: '2026-10-03', description: 'Fecha a consultar (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'La fecha de consulta es obligatoria' })
  @IsISO8601()
  date!: string;

  @ApiPropertyOptional({
    enum: AvailabilityBlock,
    description: 'Filtrar por bloque de disponibilidad declarado',
  })
  @IsOptional()
  @IsEnum(AvailabilityBlock)
  block?: AvailabilityBlock;

  @ApiPropertyOptional({
    enum: RoleName,
    description: 'Filtrar por rol técnico (ARBITRO u OFICIAL_MESA)',
  })
  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;
}
