import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MatchStatus, MatchPlatform, MatchTimeBlock } from '@sgaob/shared';

export class QueryMatchesDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial para filtrar partidos (formato YYYY-MM-DD o ISO 8601)',
    example: '2026-10-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha final para filtrar partidos (formato YYYY-MM-DD o ISO 8601)',
    example: '2026-10-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filtro por nombre de torneo (coincidencia parcial)',
    example: 'LNB',
  })
  @IsOptional()
  @IsString()
  tournament?: string;

  @ApiPropertyOptional({
    description: 'Filtro por recinto deportivo (coincidencia parcial)',
    example: 'Palestino',
  })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({
    description: 'Filtro por estado de partido',
    enum: MatchStatus,
  })
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @ApiPropertyOptional({
    description: 'Filtro por plataforma de origen (NBN23, SWISH, MANUAL)',
    enum: MatchPlatform,
  })
  @IsOptional()
  @IsEnum(MatchPlatform)
  platform?: MatchPlatform;

  @ApiPropertyOptional({
    description: 'Filtro por bloque horario asignado',
    enum: MatchTimeBlock,
  })
  @IsOptional()
  @IsEnum(MatchTimeBlock)
  timeBlock?: MatchTimeBlock;

  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
