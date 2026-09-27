import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsObject,
} from 'class-validator';
import { MatchStatus, MatchTimeBlock } from '@sgaob/shared';

export class UpdateMatchDto {
  @ApiPropertyOptional({
    description: 'Nombre del torneo o competencia',
    example: 'Liga Nacional de Básquetbol 2026',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  tournament?: string;

  @ApiPropertyOptional({
    description: 'Categoría de la competencia',
    example: 'Adulto Varones',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({
    description: 'Equipo local',
    example: 'Universidad Católica',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  homeTeam?: string;

  @ApiPropertyOptional({
    description: 'Equipo visitante',
    example: 'Colegio Los Leones',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  awayTeam?: string;

  @ApiPropertyOptional({
    description: 'Gimnasio o recinto deportivo',
    example: 'Gimnasio San Bernardo, Santiago',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  venue?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora programada del partido (ISO 8601)',
    example: '2026-10-10T20:30:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha y hora del partido debe tener formato ISO 8601 válido' })
  matchDateTime?: string;

  @ApiPropertyOptional({
    description: 'Nuevo estado del partido (si cambia a SUSPENDED, CANCELLED o RESCHEDULED alerta al personal)',
    enum: MatchStatus,
  })
  @IsOptional()
  @IsEnum(MatchStatus, { message: 'Estado de partido inválido' })
  status?: MatchStatus;

  @ApiPropertyOptional({
    description: 'Bloque horario asignado (si se omite y cambió la fecha, se recalcula automáticamente)',
    enum: MatchTimeBlock,
  })
  @IsOptional()
  @IsEnum(MatchTimeBlock, { message: 'Bloque horario inválido' })
  timeBlock?: MatchTimeBlock;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales en formato JSON',
  })
  @IsOptional()
  @IsObject()
  rawMetadata?: Record<string, any>;
}
