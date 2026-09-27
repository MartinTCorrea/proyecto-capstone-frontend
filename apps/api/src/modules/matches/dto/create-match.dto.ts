import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsObject,
} from 'class-validator';
import { MatchStatus, MatchTimeBlock, MatchPlatform } from '@sgaob/shared';

export class CreateMatchDto {
  @ApiProperty({
    description: 'Nombre del torneo o competencia',
    example: 'Liga Nacional de Básquetbol 2026',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del torneo es obligatorio' })
  @MaxLength(150)
  tournament!: string;

  @ApiProperty({
    description: 'Categoría de la competencia',
    example: 'Adulto Varones',
  })
  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @MaxLength(80)
  category!: string;

  @ApiProperty({
    description: 'Equipo local',
    example: 'Universidad Católica',
  })
  @IsString()
  @IsNotEmpty({ message: 'El equipo local es obligatorio' })
  @MaxLength(120)
  homeTeam!: string;

  @ApiProperty({
    description: 'Equipo visitante',
    example: 'Colegio Los Leones',
  })
  @IsString()
  @IsNotEmpty({ message: 'El equipo visitante es obligatorio' })
  @MaxLength(120)
  awayTeam!: string;

  @ApiProperty({
    description: 'Gimnasio o recinto deportivo',
    example: 'Estadio Palestino, Las Condes',
  })
  @IsString()
  @IsNotEmpty({ message: 'El recinto deportivo es obligatorio' })
  @MaxLength(150)
  venue!: string;

  @ApiProperty({
    description: 'Fecha y hora programada del partido (ISO 8601)',
    example: '2026-10-10T19:30:00.000Z',
  })
  @IsDateString({}, { message: 'La fecha y hora del partido debe tener formato ISO 8601 válido' })
  matchDateTime!: string;

  @ApiPropertyOptional({
    description: 'Estado inicial del partido',
    enum: MatchStatus,
    default: MatchStatus.SCHEDULED,
  })
  @IsOptional()
  @IsEnum(MatchStatus, { message: 'Estado de partido inválido' })
  status?: MatchStatus;

  @ApiPropertyOptional({
    description: 'Bloque horario asignado (si se omite, se calcula automáticamente según Anexo A.4)',
    enum: MatchTimeBlock,
  })
  @IsOptional()
  @IsEnum(MatchTimeBlock, { message: 'Bloque horario inválido' })
  timeBlock?: MatchTimeBlock;

  @ApiPropertyOptional({
    description: 'Plataforma de origen (por defecto MANUAL para partidos creados por Comisión Técnica)',
    enum: MatchPlatform,
    default: MatchPlatform.MANUAL,
  })
  @IsOptional()
  @IsEnum(MatchPlatform)
  platform?: MatchPlatform;

  @ApiPropertyOptional({
    description: 'ID externo si proviene de un sistema externo o planilla',
    example: 'EXT-10492',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales en formato JSON (árbitros sugeridos, números de planilla, etc.)',
  })
  @IsOptional()
  @IsObject()
  rawMetadata?: Record<string, any>;
}
