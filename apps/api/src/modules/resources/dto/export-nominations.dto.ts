import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportFormat {
  CSV = 'CSV',
}

export class ExportNominationsDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial para el rango de exportación (YYYY-MM-DD)',
    example: '2026-10-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate debe tener formato YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha final para el rango de exportación (YYYY-MM-DD)',
    example: '2026-10-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate debe tener formato YYYY-MM-DD' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por nombre de torneo',
    example: 'LNB Chile',
  })
  @IsOptional()
  @IsString({ message: 'El torneo debe ser una cadena de texto' })
  tournament?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por gimnasio o recinto deportivo',
    example: 'CEO Ñuñoa',
  })
  @IsOptional()
  @IsString({ message: 'El recinto debe ser una cadena de texto' })
  venue?: string;

  @ApiPropertyOptional({
    description: 'Formato de exportación (CSV compatible con Excel)',
    enum: ExportFormat,
    default: ExportFormat.CSV,
  })
  @IsOptional()
  @IsEnum(ExportFormat, { message: 'El formato de exportación debe ser CSV' })
  format?: ExportFormat = ExportFormat.CSV;
}
