import { IsOptional, Matches, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTimeBlockDto {
  @ApiPropertyOptional({ example: '09:00', description: 'Hora de inicio en formato HH:mm' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime debe tener formato válido de 24 horas (HH:mm)',
  })
  startTime?: string;

  @ApiPropertyOptional({ example: '14:00', description: 'Hora de fin en formato HH:mm' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime debe tener formato válido de 24 horas (HH:mm)',
  })
  endTime?: string;

  @ApiPropertyOptional({ example: 'Bloque matutino para fines de semana' })
  @IsOptional()
  @IsString()
  description?: string;
}
