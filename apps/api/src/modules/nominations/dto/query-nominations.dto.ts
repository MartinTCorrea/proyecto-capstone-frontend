import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NominationStatus, MatchRole } from '@sgaob/shared';

export class QueryNominationsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por partido específico (UUID)',
  })
  @IsOptional()
  @IsUUID('4')
  matchId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por usuario nominado (UUID)',
  })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de la nominación (PENDING, CONFIRMED, REJECTED)',
    enum: NominationStatus,
  })
  @IsOptional()
  @IsEnum(NominationStatus)
  status?: NominationStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por rol específico en el partido',
    enum: MatchRole,
  })
  @IsOptional()
  @IsEnum(MatchRole)
  matchRole?: MatchRole;

  @ApiPropertyOptional({
    description: 'Fecha inicial para filtrar partidos de las nominaciones (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha final para filtrar partidos de las nominaciones (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filtro por nombre de torneo',
  })
  @IsOptional()
  @IsString()
  tournament?: string;

  @ApiPropertyOptional({
    description: 'Filtro por recinto deportivo',
  })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
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
